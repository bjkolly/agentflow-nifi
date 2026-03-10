/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.LLMClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
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
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Decomposes complex tasks into subtasks using LLM-powered planning strategies.
 * Supports ReAct, Plan-and-Execute, and Tree-of-Thought planning patterns.
 * Generates subtask FlowFiles that can be routed to specialized agents.
 */
@Tags({"agentflow", "ai", "planner", "task", "decomposition", "react", "plan"})
@CapabilityDescription(
        "Decomposes complex tasks into ordered subtasks using LLM-powered planning. " +
        "Supports multiple strategies: ReAct (reason-act loop), Plan-and-Execute " +
        "(upfront planning), and Tree-of-Thought (branching exploration). Generates " +
        "subtask FlowFiles routed to specialized agents via the AgentRouter."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "plan.steps", description = "JSON array of planned steps"),
    @WritesAttribute(attribute = "plan.current_step", description = "Index of the current step being executed"),
    @WritesAttribute(attribute = "plan.assigned_agent", description = "The agent assigned to the current step"),
    @WritesAttribute(attribute = "plan.strategy", description = "The planning strategy used")
})
public class TaskPlannerProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final AllowableValue STRATEGY_REACT = new AllowableValue(
            "react", "ReAct", "Reason-Act loop: interleave reasoning with actions");
    public static final AllowableValue STRATEGY_PLAN_EXECUTE = new AllowableValue(
            "plan-and-execute", "Plan-and-Execute", "Create a full plan upfront, then execute steps");
    public static final AllowableValue STRATEGY_TREE_OF_THOUGHT = new AllowableValue(
            "tree-of-thought", "Tree-of-Thought", "Explore multiple reasoning branches");

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The LLM service used for generating plans")
            .required(true)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor PLANNING_STRATEGY = new PropertyDescriptor.Builder()
            .name("planning-strategy")
            .displayName("Planning Strategy")
            .description("The strategy used to decompose tasks into subtasks")
            .required(true)
            .allowableValues(STRATEGY_REACT, STRATEGY_PLAN_EXECUTE, STRATEGY_TREE_OF_THOUGHT)
            .defaultValue(STRATEGY_PLAN_EXECUTE.getValue())
            .build();

    public static final PropertyDescriptor MAX_PLANNING_DEPTH = new PropertyDescriptor.Builder()
            .name("max-planning-depth")
            .displayName("Max Planning Depth")
            .description("Maximum depth of recursive task decomposition")
            .required(false)
            .defaultValue("3")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor AVAILABLE_AGENTS = new PropertyDescriptor.Builder()
            .name("available-agents")
            .displayName("Available Agents (JSON)")
            .description(
                    "JSON array describing available agents and their capabilities. " +
                    "Each entry should have 'name', 'description', and 'skills'."
            )
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_SUBTASK = new Relationship.Builder()
            .name("subtask")
            .description("A generated subtask to be routed to an agent")
            .build();

    public static final Relationship REL_COMPLETE = new Relationship.Builder()
            .name("complete")
            .description("All subtasks have been planned and dispatched")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Planning failed")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(LLM_SERVICE);
        descriptors.add(PLANNING_STRATEGY);
        descriptors.add(MAX_PLANNING_DEPTH);
        descriptors.add(AVAILABLE_AGENTS);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_SUBTASK);
        relationships.add(REL_COMPLETE);
        relationships.add(REL_FAILURE);
        this.relationships = Collections.unmodifiableSet(relationships);
    }

    @Override
    public Set<Relationship> getRelationships() {
        return relationships;
    }

    @Override
    public List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        return descriptors;
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
        final String availableAgents = context.getProperty(AVAILABLE_AGENTS)
                .evaluateAttributeExpressions(flowFile).getValue();

        try {
            // Read the task goal from FlowFile content
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            String taskGoal = baos.toString(StandardCharsets.UTF_8);

            // Build planning prompt
            String planningPrompt = buildPlanningPrompt(strategy, taskGoal, availableAgents);

            // Call LLM to generate the plan
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", planningPrompt));

            Map<String, Object> response = llmService.chatCompletion(
                    messages, "claude-sonnet-4-6", 0.3, 4096, null);

            String planText = (String) response.getOrDefault("content", "");

            // TODO: Parse the plan into structured steps and create subtask FlowFiles
            // For now, write the plan to the FlowFile
            flowFile = session.putAttribute(flowFile, "plan.steps", planText);
            flowFile = session.putAttribute(flowFile, "plan.current_step", "0");
            flowFile = session.putAttribute(flowFile, "plan.strategy", strategy);

            session.transfer(flowFile, REL_SUBTASK);
            getLogger().info("Task plan generated using '{}' strategy", strategy);

        } catch (Exception e) {
            getLogger().error("Task planning failed", e);
            flowFile = session.putAttribute(flowFile, "plan.error", e.getMessage());
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private String buildPlanningPrompt(String strategy, String taskGoal, String availableAgents) {
        return switch (strategy) {
            case "react" -> String.format(
                    "You are a task planner using the ReAct strategy. " +
                    "Given this task, decide the next single action to take.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "Respond with: Thought: [your reasoning]\nAction: [agent to use]\nInput: [what to send]",
                    taskGoal, availableAgents);
            case "plan-and-execute" -> String.format(
                    "You are a task planner. Decompose this task into an ordered list of subtasks. " +
                    "For each subtask, assign the most appropriate agent.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "Respond with a JSON array of steps, each with 'step', 'description', " +
                    "'assigned_agent', and 'dependencies' (list of step numbers).",
                    taskGoal, availableAgents);
            case "tree-of-thought" -> String.format(
                    "You are a task planner using Tree-of-Thought reasoning. " +
                    "Generate 3 different approaches to solve this task, evaluate each, " +
                    "and select the best one.\n\n" +
                    "Task: %s\n\nAvailable agents:\n%s\n\n" +
                    "For each approach: describe it, list pros/cons, and give a confidence score. " +
                    "Then select the best approach and decompose it into steps.",
                    taskGoal, availableAgents);
            default -> String.format("Plan this task: %s\nAgents: %s", taskGoal, availableAgents);
        };
    }
}
