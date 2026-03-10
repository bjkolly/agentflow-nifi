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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Routes FlowFiles (tasks) to the appropriate agent Process Group based on
 * configurable routing strategies: LLM-based semantic routing, rule-based
 * attribute matching, skill-based matching, or round-robin distribution.
 */
@Tags({"agentflow", "ai", "router", "agent", "delegation", "dispatch"})
@CapabilityDescription(
        "Routes tasks to the appropriate agent Process Group. Supports multiple " +
        "routing strategies: LLM-based (uses an LLM to decide the best agent), " +
        "rule-based (routes on FlowFile attributes), skill-match (matches task " +
        "requirements to agent capabilities), and round-robin (load balancing)."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@DynamicRelationship(
        name = "agent.<name>",
        description = "Tasks are routed to dynamically-created relationships matching agent names"
)
@WritesAttributes({
    @WritesAttribute(attribute = "task.target_agent", description = "The agent this task was routed to"),
    @WritesAttribute(attribute = "router.strategy", description = "The routing strategy that was used"),
    @WritesAttribute(attribute = "router.confidence", description = "Confidence score for LLM-based routing")
})
public class AgentRouterProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final AllowableValue STRATEGY_LLM = new AllowableValue(
            "llm", "LLM-based", "Use an LLM to decide the best agent for the task");
    public static final AllowableValue STRATEGY_RULE = new AllowableValue(
            "rule", "Rule-based", "Route based on FlowFile attributes and configured rules");
    public static final AllowableValue STRATEGY_SKILL = new AllowableValue(
            "skill-match", "Skill Match", "Match task requirements to agent capabilities");
    public static final AllowableValue STRATEGY_ROUND_ROBIN = new AllowableValue(
            "round-robin", "Round Robin", "Distribute tasks evenly across agents");

    public static final PropertyDescriptor ROUTING_STRATEGY = new PropertyDescriptor.Builder()
            .name("routing-strategy")
            .displayName("Routing Strategy")
            .description("The strategy used to route tasks to agents")
            .required(true)
            .allowableValues(STRATEGY_LLM, STRATEGY_RULE, STRATEGY_SKILL, STRATEGY_ROUND_ROBIN)
            .defaultValue(STRATEGY_LLM.getValue())
            .build();

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The LLM service used for LLM-based routing (required if strategy is LLM-based)")
            .required(false)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor AGENT_REGISTRY = new PropertyDescriptor.Builder()
            .name("agent-registry")
            .displayName("Agent Registry (JSON)")
            .description(
                    "JSON array describing available agents. Each entry should have " +
                    "'name', 'description', and 'skills'. Agent names become dynamic relationships."
            )
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor FALLBACK_AGENT = new PropertyDescriptor.Builder()
            .name("fallback-agent")
            .displayName("Fallback Agent")
            .description("Agent name to use when routing cannot determine a target")
            .required(false)
            .defaultValue("default")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_DELEGATION_DEPTH = new PropertyDescriptor.Builder()
            .name("max-delegation-depth")
            .displayName("Max Delegation Depth")
            .description("Maximum number of times a task can be re-routed between agents")
            .required(false)
            .defaultValue("5")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Routing failed")
            .build();

    public static final Relationship REL_UNMATCHED = new Relationship.Builder()
            .name("unmatched")
            .description("No agent matched and no fallback configured")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;
    private final ConcurrentHashMap<String, Relationship> dynamicRelationships = new ConcurrentHashMap<>();
    private final AtomicLong roundRobinCounter = new AtomicLong(0);

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(ROUTING_STRATEGY);
        descriptors.add(LLM_SERVICE);
        descriptors.add(AGENT_REGISTRY);
        descriptors.add(FALLBACK_AGENT);
        descriptors.add(MAX_DELEGATION_DEPTH);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_FAILURE);
        relationships.add(REL_UNMATCHED);
        this.relationships = Collections.unmodifiableSet(relationships);
    }

    @Override
    public Set<Relationship> getRelationships() {
        Set<Relationship> allRelationships = new HashSet<>(relationships);
        allRelationships.addAll(dynamicRelationships.values());
        return allRelationships;
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

        final String strategy = context.getProperty(ROUTING_STRATEGY).getValue();
        final String agentRegistryJson = context.getProperty(AGENT_REGISTRY)
                .evaluateAttributeExpressions(flowFile).getValue();
        final String fallbackAgent = context.getProperty(FALLBACK_AGENT).getValue();

        try {
            // Parse agent registry
            List<Map<String, Object>> agents = objectMapper.readValue(
                    agentRegistryJson, new TypeReference<>() {});

            // Ensure dynamic relationships exist for all agents
            for (Map<String, Object> agent : agents) {
                String agentName = (String) agent.get("name");
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
                case "skill-match" -> routeWithSkillMatch(flowFile, session, agents);
                case "round-robin" -> routeRoundRobin(agents);
                default -> fallbackAgent;
            };

            if (targetAgent == null) {
                targetAgent = fallbackAgent;
            }

            // Route the FlowFile
            Relationship targetRelationship = dynamicRelationships.get(targetAgent);
            if (targetRelationship != null) {
                flowFile = session.putAttribute(flowFile, "task.target_agent", targetAgent);
                flowFile = session.putAttribute(flowFile, "router.strategy", strategy);
                session.transfer(flowFile, targetRelationship);
                getLogger().debug("Routed task to agent '{}' using '{}' strategy", targetAgent, strategy);
            } else {
                getLogger().warn("No relationship found for agent '{}', routing to unmatched", targetAgent);
                session.transfer(flowFile, REL_UNMATCHED);
            }

        } catch (Exception e) {
            getLogger().error("Agent routing failed", e);
            flowFile = session.putAttribute(flowFile, "router.error", e.getMessage());
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private String routeWithLLM(ProcessContext context, FlowFile flowFile, ProcessSession session,
                                List<Map<String, Object>> agents) throws Exception {
        LLMClientService llmService = context.getProperty(LLM_SERVICE)
                .asControllerService(LLMClientService.class);
        if (llmService == null) {
            throw new Exception("LLM Client Service is required for LLM-based routing");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        String taskContent = baos.toString(StandardCharsets.UTF_8);

        String prompt = String.format(
                "Given this task, select the best agent to handle it. " +
                "Respond with ONLY the agent name.\n\nTask: %s\n\nAvailable agents:\n%s",
                taskContent, objectMapper.writeValueAsString(agents));

        List<Map<String, String>> messages = List.of(Map.of("role", "user", "content", prompt));
        Map<String, Object> response = llmService.chatCompletion(
                messages, "claude-haiku-4-20250514", 0.0, 100, null);

        return ((String) response.getOrDefault("content", "")).trim();
    }

    private String routeWithRules(FlowFile flowFile, List<Map<String, Object>> agents) {
        // Route based on task.target_agent attribute if set
        String targetAgent = flowFile.getAttribute("task.target_agent");
        if (targetAgent != null && !targetAgent.isEmpty()) {
            return targetAgent;
        }

        // Route based on task.type attribute
        String taskType = flowFile.getAttribute("task.type");
        if (taskType != null) {
            for (Map<String, Object> agent : agents) {
                @SuppressWarnings("unchecked")
                List<String> skills = (List<String>) agent.getOrDefault("skills", List.of());
                if (skills.contains(taskType)) {
                    return (String) agent.get("name");
                }
            }
        }

        return null;
    }

    private String routeWithSkillMatch(FlowFile flowFile, ProcessSession session,
                                       List<Map<String, Object>> agents) {
        // TODO: Implement skill-based matching using task requirements vs agent capabilities
        return routeWithRules(flowFile, agents);
    }

    private String routeRoundRobin(List<Map<String, Object>> agents) {
        if (agents.isEmpty()) {
            return null;
        }
        int index = (int) (roundRobinCounter.getAndIncrement() % agents.size());
        return (String) agents.get(index).get("name");
    }
}
