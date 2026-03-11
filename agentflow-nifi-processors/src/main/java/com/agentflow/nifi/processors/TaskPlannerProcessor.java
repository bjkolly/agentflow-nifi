/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.LLMClientService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.EventDriven;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.SupportsBatching;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.SeeAlso;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.annotation.lifecycle.OnScheduled;
import org.apache.nifi.annotation.lifecycle.OnStopped;
import org.apache.nifi.components.AllowableValue;
import org.apache.nifi.components.PropertyDescriptor;
import org.apache.nifi.expression.ExpressionLanguageScope;
import org.apache.nifi.flowfile.FlowFile;
import org.apache.nifi.processor.AbstractProcessor;
import org.apache.nifi.processor.ProcessContext;
import org.apache.nifi.processor.ProcessSession;
import org.apache.nifi.processor.Relationship;
import org.apache.nifi.processor.exception.ProcessException;
import org.apache.nifi.processor.util.StandardValidators;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Decomposes complex tasks into subtasks using LLM-powered planning strategies.
 * Supports ReAct, Plan-and-Execute, and Tree-of-Thought planning patterns.
 * Generates subtask FlowFiles that can be routed to specialized agents.
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) for minimum latency</li>
 *   <li>Penalty duration: 30 sec, Yield duration: 1 sec</li>
 *   <li>This is I/O-bound (LLM calls for planning) — run duration 0ms</li>
 *   <li>Configure retry count of 10 with PENALIZE_FLOWFILE backoff (10 min max)
 *       on the 'failure' relationship</li>
 *   <li>Connect 'subtask' output to an AgentRouterProcessor for dispatch</li>
 *   <li>Connect 'complete' output to the flow's output port</li>
 *   <li>Use Plan-and-Execute strategy for deterministic, auditable plans</li>
 *   <li>Use ReAct for interactive, feedback-driven tasks</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "planner", "task", "decomposition", "react", "plan", "foundatation"})
@CapabilityDescription(
        "Decomposes complex tasks into ordered subtasks using LLM-powered planning. " +
        "Supports multiple strategies: ReAct (reason-act loop), Plan-and-Execute " +
        "(upfront planning), and Tree-of-Thought (branching exploration). Generates " +
        "subtask FlowFiles routed to specialized agents via the AgentRouter. " +
        "Recommended: penalty 30 sec, yield 1 sec, retry 10 with PENALIZE_FLOWFILE on failure."
)
@SeeAlso({AgentRouterProcessor.class, LLMInferenceProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "plan.steps", description = "JSON array of planned steps"),
    @WritesAttribute(attribute = "plan.step_count", description = "Total number of steps in the plan"),
    @WritesAttribute(attribute = "plan.current_step", description = "Index of the current step being executed"),
    @WritesAttribute(attribute = "plan.assigned_agent", description = "The agent assigned to the current step"),
    @WritesAttribute(attribute = "plan.strategy", description = "The planning strategy used"),
    @WritesAttribute(attribute = "plan.latency_ms", description = "Planning LLM call latency in milliseconds"),
    @WritesAttribute(attribute = "plan.error", description = "Error message if planning failed"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'task-planner' on failure for error routing")
})
public class TaskPlannerProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "task-planner";

    // Metrics
    private final AtomicLong totalPlans = new AtomicLong(0);
    private final AtomicLong totalSubtasks = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);

    public static final AllowableValue STRATEGY_REACT = new AllowableValue(
            "react", "ReAct", "Reason-Act loop: interleave reasoning with actions");
    public static final AllowableValue STRATEGY_PLAN_EXECUTE = new AllowableValue(
            "plan-and-execute", "Plan-and-Execute",
            "Create a full plan upfront, then execute steps — best for auditable workflows");
    public static final AllowableValue STRATEGY_TREE_OF_THOUGHT = new AllowableValue(
            "tree-of-thought", "Tree-of-Thought",
            "Explore multiple reasoning branches — best for complex decisions");

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The LLM service used for generating plans. "
                    + "Define at root Process Group level for shared access.")
            .required(true)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor PLANNING_STRATEGY = new PropertyDescriptor.Builder()
            .name("planning-strategy")
            .displayName("Planning Strategy")
            .description("The strategy used to decompose tasks into subtasks. "
                    + "Plan-and-Execute is recommended for production (auditable, deterministic). "
                    + "ReAct is better for interactive, feedback-driven tasks.")
            .required(true)
            .allowableValues(STRATEGY_REACT, STRATEGY_PLAN_EXECUTE, STRATEGY_TREE_OF_THOUGHT)
            .defaultValue(STRATEGY_PLAN_EXECUTE.getValue())
            .build();

    public static final PropertyDescriptor PLANNING_MODEL = new PropertyDescriptor.Builder()
            .name("planning-model")
            .displayName("Planning Model")
            .description("The model to use for plan generation. Use a capable model for "
                    + "complex planning. Supports Expression Language.")
            .required(false)
            .defaultValue("claude-sonnet-4-6")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_PLANNING_DEPTH = new PropertyDescriptor.Builder()
            .name("max-planning-depth")
            .displayName("Max Planning Depth")
            .description("Maximum depth of recursive task decomposition. "
                    + "Prevents unbounded plan complexity.")
            .required(false)
            .defaultValue("3")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_SUBTASKS = new PropertyDescriptor.Builder()
            .name("max-subtasks")
            .displayName("Max Subtasks")
            .description("Maximum number of subtasks the planner can generate per invocation. "
                    + "Prevents runaway planning.")
            .required(false)
            .defaultValue("20")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor AVAILABLE_AGENTS = new PropertyDescriptor.Builder()
            .name("available-agents")
            .displayName("Available Agents (JSON)")
            .description(
                    "JSON array describing available agents and their capabilities. " +
                    "Each entry should have 'name', 'description', and 'skills'. " +
                    "Supports Expression Language for dynamic agent registries."
            )
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_SUBTASK = new Relationship.Builder()
            .name("subtask")
            .description("A generated subtask to be routed to an agent via AgentRouterProcessor.")
            .build();

    public static final Relationship REL_COMPLETE = new Relationship.Builder()
            .name("complete")
            .description("All subtasks have been planned and dispatched.")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Planning failed. Configure retry count 10, PENALIZE_FLOWFILE, max 10 mins.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            LLM_SERVICE, PLANNING_STRATEGY, PLANNING_MODEL,
            MAX_PLANNING_DEPTH, MAX_SUBTASKS, AVAILABLE_AGENTS
    );

    private final Set<Relationship> relationships = Set.of(
            REL_SUBTASK, REL_COMPLETE, REL_FAILURE
    );

    @Override
    public Set<Relationship> getRelationships() {
        return relationships;
    }

    @Override
    public List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        return descriptors;
    }

    @OnScheduled
    public void onScheduled(final ProcessContext context) {
        totalPlans.set(0);
        totalSubtasks.set(0);
        totalErrors.set(0);
        getLogger().info("TaskPlannerProcessor scheduled — strategy: {}, model: {}, max depth: {}",
                context.getProperty(PLANNING_STRATEGY).getValue(),
                context.getProperty(PLANNING_MODEL).getValue(),
                context.getProperty(MAX_PLANNING_DEPTH).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("TaskPlannerProcessor stopped — plans: {}, subtasks: {}, errors: {}",
                totalPlans.get(), totalSubtasks.get(), totalErrors.get());
    }

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        final LLMClientService llmService = context.getProperty(LLM_SERVICE)
                .asControllerService(LLMClientService.class);
        final String strategy = context.getProperty(PLANNING_STRATEGY).getValue();
        final String model = context.getProperty(PLANNING_MODEL)
                .evaluateAttributeExpressions(flowFile).getValue();
        final String availableAgents = context.getProperty(AVAILABLE_AGENTS)
                .evaluateAttributeExpressions(flowFile).getValue();
        final int maxSubtasks = context.getProperty(MAX_SUBTASKS).asInteger();

        final long startTime = System.currentTimeMillis();

        try {
            // Read the task goal from FlowFile content
            final ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            final String taskGoal = baos.toString(StandardCharsets.UTF_8);

            // Build planning prompt
            final String planningPrompt = buildPlanningPrompt(strategy, taskGoal, availableAgents);

            // Call LLM to generate the plan
            final List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", planningPrompt));

            final Map<String, Object> response = llmService.chatCompletion(
                    messages, model, 0.3, 4096, null);

            final String planText = (String) response.getOrDefault("content", "");
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalPlans.incrementAndGet();

            // Parse plan into structured steps
            List<Map<String, Object>> steps = parsePlanSteps(planText);

            // Enforce max subtasks limit
            if (steps.size() > maxSubtasks) {
                getLogger().warn("Plan generated {} steps, truncating to max {}",
                        steps.size(), maxSubtasks);
                steps = steps.subList(0, maxSubtasks);
            }

            if (steps.isEmpty()) {
                // No structured steps found — write raw plan for downstream processing
                final Map<String, String> attrs = new HashMap<>();
                attrs.put("plan.steps", planText);
                attrs.put("plan.step_count", "1");
                attrs.put("plan.current_step", "0");
                attrs.put("plan.strategy", strategy);
                attrs.put("plan.latency_ms", String.valueOf(latencyMs));
                flowFile = session.putAllAttributes(flowFile, attrs);
                session.transfer(flowFile, REL_SUBTASK);
                totalSubtasks.incrementAndGet();
            } else {
                // Create a FlowFile for each subtask step
                final String stepsJson = objectMapper.writeValueAsString(steps);
                for (int i = 0; i < steps.size(); i++) {
                    final Map<String, Object> step = steps.get(i);
                    FlowFile subtaskFF = session.clone(flowFile);

                    final Map<String, String> attrs = new HashMap<>();
                    attrs.put("plan.steps", stepsJson);
                    attrs.put("plan.step_count", String.valueOf(steps.size()));
                    attrs.put("plan.current_step", String.valueOf(i));
                    attrs.put("plan.strategy", strategy);
                    attrs.put("plan.latency_ms", String.valueOf(latencyMs));

                    final String assignedAgent = (String) step.getOrDefault("assigned_agent", "default");
                    attrs.put("plan.assigned_agent", assignedAgent);
                    attrs.put("task.target_agent", assignedAgent);

                    final String stepDesc = (String) step.getOrDefault("description", "");
                    attrs.put("plan.step_description", stepDesc);

                    subtaskFF = session.putAllAttributes(subtaskFF, attrs);

                    // Write step details as subtask FlowFile content
                    final String stepContent = objectMapper.writeValueAsString(step);
                    subtaskFF = session.write(subtaskFF, out ->
                            out.write(stepContent.getBytes(StandardCharsets.UTF_8)));

                    session.transfer(subtaskFF, REL_SUBTASK);
                    totalSubtasks.incrementAndGet();
                }

                // Transfer original FlowFile to complete
                flowFile = session.putAttribute(flowFile, "plan.steps", stepsJson);
                flowFile = session.putAttribute(flowFile, "plan.step_count",
                        String.valueOf(steps.size()));
                flowFile = session.putAttribute(flowFile, "plan.strategy", strategy);
                flowFile = session.putAttribute(flowFile, "plan.latency_ms",
                        String.valueOf(latencyMs));
                session.transfer(flowFile, REL_COMPLETE);
            }

            getLogger().info("Task plan generated using '{}' strategy — {} steps in {}ms",
                    strategy, steps.size(), latencyMs);

        } catch (Exception e) {
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalErrors.incrementAndGet();
            getLogger().error("Task planning failed after {}ms", latencyMs, e);
            flowFile = session.putAttribute(flowFile, "plan.error",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            flowFile = session.putAttribute(flowFile, "plan.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    /**
     * Attempts to parse the LLM's plan response into structured step objects.
     * Falls back to empty list if parsing fails.
     */
    private List<Map<String, Object>> parsePlanSteps(String planText) {
        try {
            // Try parsing as JSON array directly
            return objectMapper.readValue(planText, new TypeReference<>() {});
        } catch (Exception e) {
            // Try extracting JSON from markdown code block
            try {
                final int jsonStart = planText.indexOf('[');
                final int jsonEnd = planText.lastIndexOf(']');
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                    final String jsonSubstring = planText.substring(jsonStart, jsonEnd + 1);
                    return objectMapper.readValue(jsonSubstring, new TypeReference<>() {});
                }
            } catch (Exception inner) {
                getLogger().debug("Could not parse plan as structured JSON, treating as raw text");
            }
        }
        return List.of();
    }

    private String buildPlanningPrompt(String strategy, String taskGoal, String availableAgents) {
        return switch (strategy) {
            case "react" -> String.format(
                    "You are a task planner using the ReAct strategy. " +
                    "Given this task, decide the next single action to take.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "Respond with a JSON array containing ONE step: " +
                    "[{\"step\": 1, \"description\": \"...\", \"assigned_agent\": \"...\", " +
                    "\"reasoning\": \"...\"}]",
                    taskGoal, availableAgents);
            case "plan-and-execute" -> String.format(
                    "You are a task planner. Decompose this task into an ordered list of subtasks. " +
                    "For each subtask, assign the most appropriate agent.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "Respond with a JSON array of steps: " +
                    "[{\"step\": 1, \"description\": \"...\", \"assigned_agent\": \"...\", " +
                    "\"dependencies\": []}]",
                    taskGoal, availableAgents);
            case "tree-of-thought" -> String.format(
                    "You are a task planner using Tree-of-Thought reasoning. " +
                    "Generate 3 different approaches to solve this task, evaluate each, " +
                    "and select the best one.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "Respond with a JSON array of steps for the BEST approach: " +
                    "[{\"step\": 1, \"description\": \"...\", \"assigned_agent\": \"...\", " +
                    "\"reasoning\": \"...\", \"confidence\": 0.0}]",
                    taskGoal, availableAgents);
            default -> String.format(
                    "Plan this task as a JSON array of steps: %s\nAgents: %s",
                    taskGoal, availableAgents);
        };
    }
}
