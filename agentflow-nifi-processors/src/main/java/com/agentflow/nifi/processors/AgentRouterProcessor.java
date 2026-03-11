/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.LLMClientService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.DynamicRelationship;
import org.apache.nifi.annotation.behavior.EventDriven;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.ReadsAttribute;
import org.apache.nifi.annotation.behavior.ReadsAttributes;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Routes FlowFiles (tasks) to the appropriate agent Process Group based on
 * configurable routing strategies: LLM-based semantic routing, rule-based
 * attribute matching, skill-based matching, or round-robin distribution.
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) for minimum latency</li>
 *   <li>Penalty duration: 30 sec, Yield duration: 1 sec</li>
 *   <li>For rule-based/round-robin routing: run duration 25ms (CPU-bound)</li>
 *   <li>For LLM-based routing: run duration 0ms (I/O-bound)</li>
 *   <li>Configure retry count of 10 with PENALIZE_FLOWFILE backoff (10 min max)
 *       on the 'failure' relationship</li>
 *   <li>Use NiFi Expression Language patterns for rule-based routing, similar to
 *       RouteOnAttribute (e.g., ${task.type:equals('research')})</li>
 *   <li>Connect each dynamic agent relationship to the corresponding agent
 *       Process Group's input port</li>
 *   <li>Connect 'unmatched' to an Unmatched Handling Process Group</li>
 *   <li>Track delegation depth to prevent infinite routing loops</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "router", "agent", "delegation", "dispatch", "route", "foundatation"})
@CapabilityDescription(
        "Routes tasks to the appropriate agent Process Group. Supports multiple " +
        "routing strategies: LLM-based (uses an LLM to decide the best agent), " +
        "rule-based (routes on FlowFile attributes like RouteOnAttribute), skill-match " +
        "(matches task requirements to agent capabilities), and round-robin (load " +
        "balancing). Agent names become dynamic relationships for connection to " +
        "agent Process Groups. " +
        "Recommended: penalty 30 sec, yield 1 sec, retry 10 on failure."
)
@SeeAlso({TaskPlannerProcessor.class, LLMInferenceProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@DynamicRelationship(
        name = "agent.<name>",
        description = "Tasks are routed to dynamically-created relationships matching agent names. " +
                "Connect each to the corresponding agent Process Group input port."
)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.target_agent", description = "Pre-assigned target agent (rule-based routing)"),
    @ReadsAttribute(attribute = "task.type", description = "Task type for skill matching"),
    @ReadsAttribute(attribute = "router.delegation_depth", description = "Current delegation depth for loop prevention")
})
@WritesAttributes({
    @WritesAttribute(attribute = "task.target_agent", description = "The agent this task was routed to"),
    @WritesAttribute(attribute = "router.strategy", description = "The routing strategy that was used"),
    @WritesAttribute(attribute = "router.confidence", description = "Confidence score for LLM-based routing"),
    @WritesAttribute(attribute = "router.delegation_depth", description = "Incremented delegation depth"),
    @WritesAttribute(attribute = "router.error", description = "Error message if routing failed"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'agent-router' on failure for error routing")
})
public class AgentRouterProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "agent-router";

    // Metrics
    private final AtomicLong totalRouted = new AtomicLong(0);
    private final AtomicLong totalUnmatched = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final AtomicLong roundRobinCounter = new AtomicLong(0);

    private final ConcurrentHashMap<String, Relationship> dynamicRelationships = new ConcurrentHashMap<>();

    public static final AllowableValue STRATEGY_LLM = new AllowableValue(
            "llm", "LLM-based", "Use an LLM to decide the best agent for the task");
    public static final AllowableValue STRATEGY_RULE = new AllowableValue(
            "rule", "Rule-based",
            "Route based on FlowFile attributes — similar to RouteOnAttribute patterns");
    public static final AllowableValue STRATEGY_SKILL = new AllowableValue(
            "skill-match", "Skill Match", "Match task requirements to agent capabilities");
    public static final AllowableValue STRATEGY_ROUND_ROBIN = new AllowableValue(
            "round-robin", "Round Robin", "Distribute tasks evenly across agents");

    public static final PropertyDescriptor ROUTING_STRATEGY = new PropertyDescriptor.Builder()
            .name("routing-strategy")
            .displayName("Routing Strategy")
            .description("The strategy used to route tasks to agents. Rule-based is recommended "
                    + "for production (deterministic, auditable). LLM-based is useful for "
                    + "dynamic task assignment.")
            .required(true)
            .allowableValues(STRATEGY_LLM, STRATEGY_RULE, STRATEGY_SKILL, STRATEGY_ROUND_ROBIN)
            .defaultValue(STRATEGY_RULE.getValue())
            .build();

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The LLM service used for LLM-based routing (required if strategy is LLM-based). "
                    + "Use a fast model (e.g., claude-haiku) for low-latency routing.")
            .required(false)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor ROUTING_MODEL = new PropertyDescriptor.Builder()
            .name("routing-model")
            .displayName("Routing Model")
            .description("The model to use for LLM-based routing. Use a fast, cheap model "
                    + "since routing decisions should be quick.")
            .required(false)
            .defaultValue("claude-haiku-4-20250514")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor AGENT_REGISTRY = new PropertyDescriptor.Builder()
            .name("agent-registry")
            .displayName("Agent Registry (JSON)")
            .description(
                    "JSON array describing available agents. Each entry should have " +
                    "'name', 'description', and 'skills'. Agent names become dynamic relationships. " +
                    "Supports Expression Language for dynamic registries from parameters."
            )
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor FALLBACK_AGENT = new PropertyDescriptor.Builder()
            .name("fallback-agent")
            .displayName("Fallback Agent")
            .description("Agent name to use when routing cannot determine a target. "
                    + "Must match a name in the Agent Registry.")
            .required(false)
            .defaultValue("default")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_DELEGATION_DEPTH = new PropertyDescriptor.Builder()
            .name("max-delegation-depth")
            .displayName("Max Delegation Depth")
            .description("Maximum number of times a task can be re-routed between agents. "
                    + "Prevents infinite routing loops. Similar to NiFi's back-pressure "
                    + "concept for flow control.")
            .required(false)
            .defaultValue("5")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Routing failed. Configure retry count 10, PENALIZE_FLOWFILE, max 10 mins.")
            .build();

    public static final Relationship REL_UNMATCHED = new Relationship.Builder()
            .name("unmatched")
            .description("No agent matched and no fallback configured. "
                    + "Connect to an Unmatched Handling Process Group.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            ROUTING_STRATEGY, LLM_SERVICE, ROUTING_MODEL,
            AGENT_REGISTRY, FALLBACK_AGENT, MAX_DELEGATION_DEPTH
    );

    private final Set<Relationship> staticRelationships = Set.of(REL_FAILURE, REL_UNMATCHED);

    @Override
    public Set<Relationship> getRelationships() {
        final Set<Relationship> allRelationships = new HashSet<>(staticRelationships);
        allRelationships.addAll(dynamicRelationships.values());
        return allRelationships;
    }

    @Override
    public List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        return descriptors;
    }

    @OnScheduled
    public void onScheduled(final ProcessContext context) {
        totalRouted.set(0);
        totalUnmatched.set(0);
        totalErrors.set(0);
        roundRobinCounter.set(0);
        getLogger().info("AgentRouterProcessor scheduled — strategy: {}, fallback: {}, max depth: {}",
                context.getProperty(ROUTING_STRATEGY).getValue(),
                context.getProperty(FALLBACK_AGENT).getValue(),
                context.getProperty(MAX_DELEGATION_DEPTH).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("AgentRouterProcessor stopped — routed: {}, unmatched: {}, errors: {}",
                totalRouted.get(), totalUnmatched.get(), totalErrors.get());
        dynamicRelationships.clear();
    }

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        final String strategy = context.getProperty(ROUTING_STRATEGY).getValue();
        final String agentRegistryJson = context.getProperty(AGENT_REGISTRY)
                .evaluateAttributeExpressions(flowFile).getValue();
        final String fallbackAgent = context.getProperty(FALLBACK_AGENT)
                .evaluateAttributeExpressions(flowFile).getValue();
        final int maxDepth = context.getProperty(MAX_DELEGATION_DEPTH).asInteger();

        try {
            // Check delegation depth to prevent infinite loops
            final String depthStr = flowFile.getAttribute("router.delegation_depth");
            final int currentDepth = depthStr != null ? Integer.parseInt(depthStr) : 0;
            if (currentDepth >= maxDepth) {
                getLogger().warn("Max delegation depth {} reached for task {}",
                        maxDepth, flowFile.getAttribute("task.id"));
                flowFile = session.putAttribute(flowFile, "router.error",
                        "Max delegation depth exceeded: " + currentDepth);
                flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
                session.transfer(flowFile, REL_FAILURE);
                return;
            }

            // Parse agent registry
            final List<Map<String, Object>> agents = objectMapper.readValue(
                    agentRegistryJson, new TypeReference<>() {});

            // Ensure dynamic relationships exist for all agents
            for (Map<String, Object> agent : agents) {
                final String agentName = (String) agent.get("name");
                dynamicRelationships.computeIfAbsent(agentName, name ->
                        new Relationship.Builder()
                                .name("agent." + name)
                                .description("Route to agent: " + name)
                                .build());
            }

            // Determine target agent based on strategy
            String targetAgent = switch (strategy) {
                case "llm" -> routeWithLLM(context, flowFile, session, agents);
                case "rule" -> routeWithRules(flowFile, agents);
                case "skill-match" -> routeWithSkillMatch(flowFile, agents);
                case "round-robin" -> routeRoundRobin(agents);
                default -> fallbackAgent;
            };

            if (targetAgent == null || targetAgent.isEmpty()) {
                targetAgent = fallbackAgent;
            }

            // Route the FlowFile
            final Relationship targetRelationship = dynamicRelationships.get(targetAgent);
            if (targetRelationship != null) {
                final Map<String, String> attrs = new HashMap<>();
                attrs.put("task.target_agent", targetAgent);
                attrs.put("router.strategy", strategy);
                attrs.put("router.delegation_depth", String.valueOf(currentDepth + 1));
                flowFile = session.putAllAttributes(flowFile, attrs);

                session.transfer(flowFile, targetRelationship);
                session.getProvenanceReporter().route(flowFile, targetRelationship.getName(),
                        "Routed to agent '" + targetAgent + "' via " + strategy + " strategy");
                totalRouted.incrementAndGet();

                getLogger().debug("Routed task {} to agent '{}' using '{}' strategy (depth={})",
                        flowFile.getAttribute("task.id"), targetAgent, strategy, currentDepth + 1);
            } else {
                getLogger().warn("No relationship found for agent '{}', routing to unmatched", targetAgent);
                flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
                session.transfer(flowFile, REL_UNMATCHED);
                totalUnmatched.incrementAndGet();
            }

        } catch (Exception e) {
            totalErrors.incrementAndGet();
            getLogger().error("Agent routing failed for task {}",
                    flowFile.getAttribute("task.id"), e);
            flowFile = session.putAttribute(flowFile, "router.error",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private String routeWithLLM(ProcessContext context, FlowFile flowFile, ProcessSession session,
                                List<Map<String, Object>> agents) throws Exception {
        final LLMClientService llmService = context.getProperty(LLM_SERVICE)
                .asControllerService(LLMClientService.class);
        if (llmService == null) {
            throw new ProcessException("LLM Client Service is required for LLM-based routing");
        }

        final String model = context.getProperty(ROUTING_MODEL)
                .evaluateAttributeExpressions(flowFile).getValue();

        final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        final String taskContent = baos.toString(StandardCharsets.UTF_8);

        final String prompt = String.format(
                "Given this task, select the best agent to handle it. " +
                "Respond with ONLY the agent name, nothing else.\n\n" +
                "Task: %s\n\nAvailable agents:\n%s",
                taskContent, objectMapper.writeValueAsString(agents));

        final List<Map<String, String>> messages = List.of(
                Map.of("role", "user", "content", prompt));
        final Map<String, Object> response = llmService.chatCompletion(
                messages, model, 0.0, 100, null);

        return ((String) response.getOrDefault("content", "")).trim();
    }

    private String routeWithRules(FlowFile flowFile, List<Map<String, Object>> agents) {
        // Route based on task.target_agent attribute if pre-set (e.g., by TaskPlanner)
        final String targetAgent = flowFile.getAttribute("task.target_agent");
        if (targetAgent != null && !targetAgent.isEmpty()) {
            return targetAgent;
        }

        // Route based on task.type attribute matched against agent skills
        final String taskType = flowFile.getAttribute("task.type");
        if (taskType != null) {
            for (Map<String, Object> agent : agents) {
                @SuppressWarnings("unchecked")
                final List<String> skills = (List<String>) agent.getOrDefault("skills", List.of());
                if (skills.contains(taskType)) {
                    return (String) agent.get("name");
                }
            }
        }

        return null;
    }

    private String routeWithSkillMatch(FlowFile flowFile, List<Map<String, Object>> agents) {
        // Skill matching: find the agent with the most matching skills
        final String taskType = flowFile.getAttribute("task.type");
        final String taskRequirements = flowFile.getAttribute("task.requirements");

        String bestAgent = null;
        int bestScore = 0;

        for (Map<String, Object> agent : agents) {
            @SuppressWarnings("unchecked")
            final List<String> skills = (List<String>) agent.getOrDefault("skills", List.of());
            int score = 0;

            if (taskType != null && skills.contains(taskType)) {
                score += 10;
            }

            if (taskRequirements != null) {
                for (String skill : skills) {
                    if (taskRequirements.toLowerCase().contains(skill.toLowerCase())) {
                        score += 1;
                    }
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestAgent = (String) agent.get("name");
            }
        }

        return bestAgent;
    }

    private String routeRoundRobin(List<Map<String, Object>> agents) {
        if (agents.isEmpty()) {
            return null;
        }
        final int index = (int) (roundRobinCounter.getAndIncrement() % agents.size());
        return (String) agents.get(index).get("name");
    }
}
