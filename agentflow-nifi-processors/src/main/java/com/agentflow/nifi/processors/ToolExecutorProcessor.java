/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.GuardrailsService;
import com.agentflow.nifi.services.ToolRegistryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.components.PropertyDescriptor;
import org.apache.nifi.flowfile.FlowFile;
import org.apache.nifi.processor.AbstractProcessor;
import org.apache.nifi.processor.ProcessContext;
import org.apache.nifi.processor.ProcessSession;
import org.apache.nifi.processor.Relationship;
import org.apache.nifi.processor.exception.ProcessException;
import org.apache.nifi.processor.util.StandardValidators;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Executes tool/function calls requested by the LLM. Reads tool call information
 * from the FlowFile attributes (set by {@link LLMInferenceProcessor}), executes
 * each tool via the {@link ToolRegistryService}, and writes the results back.
 */
@Tags({"agentflow", "ai", "tool", "function", "executor", "mcp"})
@CapabilityDescription(
        "Executes tool/function calls requested by the LLM during an agent loop. " +
        "Reads tool call definitions from the 'llm.tool_calls' FlowFile attribute, " +
        "executes each tool via the configured ToolRegistryService, and writes " +
        "results back to the FlowFile for the next LLM iteration."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "tool.result", description = "JSON result from the last tool execution"),
    @WritesAttribute(attribute = "tool.name", description = "Name of the last tool executed"),
    @WritesAttribute(attribute = "tool.execution_time_ms", description = "Execution time in milliseconds")
})
public class ToolExecutorProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final PropertyDescriptor TOOL_REGISTRY = new PropertyDescriptor.Builder()
            .name("tool-registry-service")
            .displayName("Tool Registry Service")
            .description("The controller service providing tool registration and execution")
            .required(true)
            .identifiesControllerService(ToolRegistryService.class)
            .build();

    public static final PropertyDescriptor GUARDRAILS_SERVICE = new PropertyDescriptor.Builder()
            .name("guardrails-service")
            .displayName("Guardrails Service")
            .description("Optional guardrails service to validate tool actions before execution")
            .required(false)
            .identifiesControllerService(GuardrailsService.class)
            .build();

    public static final PropertyDescriptor EXECUTION_TIMEOUT = new PropertyDescriptor.Builder()
            .name("execution-timeout")
            .displayName("Execution Timeout (seconds)")
            .description("Maximum time to wait for a single tool execution")
            .required(false)
            .defaultValue("30")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("Tool execution completed successfully — route back to LLM")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Tool execution failed")
            .build();

    public static final Relationship REL_REQUIRES_HUMAN = new Relationship.Builder()
            .name("requires_human")
            .description("Tool action requires human approval before execution")
            .build();

    public static final Relationship REL_UNAUTHORIZED = new Relationship.Builder()
            .name("unauthorized")
            .description("Tool action was blocked by guardrails")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(TOOL_REGISTRY);
        descriptors.add(GUARDRAILS_SERVICE);
        descriptors.add(EXECUTION_TIMEOUT);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_SUCCESS);
        relationships.add(REL_FAILURE);
        relationships.add(REL_REQUIRES_HUMAN);
        relationships.add(REL_UNAUTHORIZED);
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

        final ToolRegistryService toolRegistry = context.getProperty(TOOL_REGISTRY)
                .asControllerService(ToolRegistryService.class);

        final GuardrailsService guardrails = context.getProperty(GUARDRAILS_SERVICE).isSet()
                ? context.getProperty(GUARDRAILS_SERVICE).asControllerService(GuardrailsService.class)
                : null;

        // Read tool calls from FlowFile attribute
        String toolCallsJson = flowFile.getAttribute("llm.tool_calls");
        if (toolCallsJson == null || toolCallsJson.isEmpty()) {
            getLogger().warn("No tool calls found in FlowFile attributes");
            session.transfer(flowFile, REL_FAILURE);
            return;
        }

        try {
            List<Map<String, Object>> toolCalls = objectMapper.readValue(
                    toolCallsJson, new TypeReference<>() {});

            List<Map<String, Object>> results = new ArrayList<>();

            for (Map<String, Object> toolCall : toolCalls) {
                String toolName = (String) toolCall.get("name");
                String arguments = objectMapper.writeValueAsString(toolCall.get("arguments"));

                // Check guardrails if configured
                if (guardrails != null) {
                    Map<String, String> actionContext = new HashMap<>();
                    actionContext.put("agent.name", flowFile.getAttribute("task.origin_agent"));
                    actionContext.put("task.id", flowFile.getAttribute("task.id"));

                    if (!guardrails.isActionPermitted(toolName, actionContext)) {
                        getLogger().warn("Tool '{}' blocked by guardrails", toolName);
                        flowFile = session.putAttribute(flowFile, "tool.name", toolName);
                        flowFile = session.putAttribute(flowFile, "tool.blocked_reason", "guardrails_violation");
                        session.transfer(flowFile, REL_UNAUTHORIZED);
                        return;
                    }
                }

                // Execute the tool
                long startTime = System.currentTimeMillis();
                String result = toolRegistry.executeTool(toolName, arguments);
                long executionTime = System.currentTimeMillis() - startTime;

                results.add(Map.of(
                        "tool_name", toolName,
                        "result", result,
                        "execution_time_ms", executionTime
                ));

                flowFile = session.putAttribute(flowFile, "tool.name", toolName);
                flowFile = session.putAttribute(flowFile, "tool.result", result);
                flowFile = session.putAttribute(flowFile, "tool.execution_time_ms", String.valueOf(executionTime));

                getLogger().debug("Tool '{}' executed in {}ms", toolName, executionTime);
            }

            // Append tool results to the FlowFile content (conversation history)
            String resultsJson = objectMapper.writeValueAsString(results);
            flowFile = session.write(flowFile, out -> {
                // TODO: Properly merge tool results into the conversation history
                out.write(resultsJson.getBytes(StandardCharsets.UTF_8));
            });

            session.transfer(flowFile, REL_SUCCESS);

        } catch (ToolRegistryService.ToolExecutionException e) {
            getLogger().error("Tool execution failed: {} - {}", e.getToolName(), e.getMessage());
            flowFile = session.putAttribute(flowFile, "tool.error", e.getMessage());
            flowFile = session.putAttribute(flowFile, "tool.name", e.getToolName());
            session.transfer(flowFile, REL_FAILURE);
        } catch (Exception e) {
            getLogger().error("Unexpected error in tool execution", e);
            flowFile = session.putAttribute(flowFile, "tool.error", e.getMessage());
            session.transfer(flowFile, REL_FAILURE);
        }
    }
}
