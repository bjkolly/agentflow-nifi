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
import org.apache.nifi.components.PropertyDescriptor;
import org.apache.nifi.expression.ExpressionLanguageScope;
import org.apache.nifi.flowfile.FlowFile;
import org.apache.nifi.processor.AbstractProcessor;
import org.apache.nifi.processor.ProcessContext;
import org.apache.nifi.processor.ProcessSession;
import org.apache.nifi.processor.Relationship;
import org.apache.nifi.processor.exception.ProcessException;
import org.apache.nifi.processor.util.StandardValidators;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Executes tool/function calls requested by the LLM. Reads tool call information
 * from the FlowFile attributes (set by {@link LLMInferenceProcessor}), executes
 * each tool via the {@link ToolRegistryService}, and writes the results back.
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) — triggers immediately when FlowFiles arrive</li>
 *   <li>Penalty duration: 30 sec, Yield duration: 1 sec</li>
 *   <li>This is an I/O-bound processor — run duration should be 0ms</li>
 *   <li>Configure retry count of 10 with YIELD_PROCESSOR backoff (2 min max)
 *       on the 'failure' relationship</li>
 *   <li>Always configure a GuardrailsService for production deployments</li>
 *   <li>Connect 'success' output back to the LLMInferenceProcessor for the next
 *       agent loop iteration</li>
 *   <li>Connect 'requires_human' to a HumanInTheLoopProcessor</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "tool", "function", "executor", "mcp", "foundatation"})
@CapabilityDescription(
        "Executes tool/function calls requested by the LLM during an agent loop. " +
        "Reads tool call definitions from the 'llm.tool_calls' FlowFile attribute, " +
        "executes each tool via the configured ToolRegistryService, and writes " +
        "results back to the FlowFile for the next LLM iteration. Optionally validates " +
        "tool actions against a GuardrailsService before execution. " +
        "Recommended: penalty 30 sec, yield 1 sec, retry 10 with YIELD_PROCESSOR on failure."
)
@SeeAlso({LLMInferenceProcessor.class, GuardrailsEnforcerProcessor.class, HumanInTheLoopProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "llm.tool_calls", description = "JSON array of tool calls from the LLM"),
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier"),
    @ReadsAttribute(attribute = "task.origin_agent", description = "The agent that originated the task")
})
@WritesAttributes({
    @WritesAttribute(attribute = "tool.result", description = "JSON result from the last tool execution"),
    @WritesAttribute(attribute = "tool.name", description = "Name of the last tool executed"),
    @WritesAttribute(attribute = "tool.execution_time_ms", description = "Execution time in milliseconds"),
    @WritesAttribute(attribute = "tool.total_calls", description = "Total number of tool calls executed in this invocation"),
    @WritesAttribute(attribute = "tool.error", description = "Error message if tool execution failed"),
    @WritesAttribute(attribute = "tool.blocked_reason", description = "Reason if tool was blocked by guardrails"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'tool-executor' on failure for error routing")
})
public class ToolExecutorProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "tool-executor";

    // Metrics counters
    private final AtomicLong totalExecutions = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final AtomicLong totalBlocked = new AtomicLong(0);

    public static final PropertyDescriptor TOOL_REGISTRY = new PropertyDescriptor.Builder()
            .name("tool-registry-service")
            .displayName("Tool Registry Service")
            .description("The controller service providing tool registration and execution. "
                    + "Define at root Process Group level for shared access across agents.")
            .required(true)
            .identifiesControllerService(ToolRegistryService.class)
            .build();

    public static final PropertyDescriptor GUARDRAILS_SERVICE = new PropertyDescriptor.Builder()
            .name("guardrails-service")
            .displayName("Guardrails Service")
            .description("Optional guardrails service to validate tool actions before execution. "
                    + "Strongly recommended for production deployments. When set, each tool call "
                    + "is checked against the guardrails policy before execution.")
            .required(false)
            .identifiesControllerService(GuardrailsService.class)
            .build();

    public static final PropertyDescriptor EXECUTION_TIMEOUT = new PropertyDescriptor.Builder()
            .name("execution-timeout")
            .displayName("Execution Timeout")
            .description("Maximum time to wait for a single tool execution. "
                    + "Best practice: 30 secs for HTTP tools, longer for database/compute tools.")
            .required(false)
            .defaultValue("30 secs")
            .addValidator(StandardValidators.TIME_PERIOD_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_TOOL_CALLS_PER_INVOCATION = new PropertyDescriptor.Builder()
            .name("max-tool-calls")
            .displayName("Max Tool Calls Per Invocation")
            .description("Maximum number of tool calls to execute in a single processor invocation. "
                    + "Prevents runaway tool execution from a single LLM response.")
            .required(false)
            .defaultValue("10")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("Tool execution completed successfully — route back to LLM for next iteration.")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Tool execution failed. Configure retry count 10, YIELD_PROCESSOR, max 2 mins.")
            .build();

    public static final Relationship REL_REQUIRES_HUMAN = new Relationship.Builder()
            .name("requires_human")
            .description("Tool action requires human approval before execution. "
                    + "Connect to a HumanInTheLoopProcessor.")
            .build();

    public static final Relationship REL_UNAUTHORIZED = new Relationship.Builder()
            .name("unauthorized")
            .description("Tool action was blocked by guardrails policy.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            TOOL_REGISTRY, GUARDRAILS_SERVICE, EXECUTION_TIMEOUT, MAX_TOOL_CALLS_PER_INVOCATION
    );

    private final Set<Relationship> relationships = Set.of(
            REL_SUCCESS, REL_FAILURE, REL_REQUIRES_HUMAN, REL_UNAUTHORIZED
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
        totalExecutions.set(0);
        totalErrors.set(0);
        totalBlocked.set(0);
        getLogger().info("ToolExecutorProcessor scheduled — timeout: {}, max calls: {}",
                context.getProperty(EXECUTION_TIMEOUT).getValue(),
                context.getProperty(MAX_TOOL_CALLS_PER_INVOCATION).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("ToolExecutorProcessor stopped — total executions: {}, errors: {}, blocked: {}",
                totalExecutions.get(), totalErrors.get(), totalBlocked.get());
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

        final int maxToolCalls = context.getProperty(MAX_TOOL_CALLS_PER_INVOCATION).asInteger();

        // Read tool calls from FlowFile attribute
        final String toolCallsJson = flowFile.getAttribute("llm.tool_calls");
        if (toolCallsJson == null || toolCallsJson.isEmpty()) {
            getLogger().warn("No tool calls found in FlowFile attributes for task {}",
                    flowFile.getAttribute("task.id"));
            flowFile = session.putAttribute(flowFile, "tool.error", "No tool calls in FlowFile attributes");
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
            return;
        }

        try {
            final List<Map<String, Object>> toolCalls = objectMapper.readValue(
                    toolCallsJson, new TypeReference<>() {});

            // Enforce max tool calls limit
            if (toolCalls.size() > maxToolCalls) {
                getLogger().warn("Tool call count {} exceeds max {} for task {}",
                        toolCalls.size(), maxToolCalls, flowFile.getAttribute("task.id"));
                flowFile = session.putAttribute(flowFile, "tool.error",
                        "Too many tool calls: " + toolCalls.size() + " > " + maxToolCalls);
                flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
                session.transfer(flowFile, REL_FAILURE);
                return;
            }

            final List<Map<String, Object>> results = new ArrayList<>();

            for (Map<String, Object> toolCall : toolCalls) {
                final String toolName = (String) toolCall.get("name");
                if (toolName == null || toolName.isEmpty()) {
                    getLogger().error("Tool call missing 'name' field in task {}: {}",
                            flowFile.getAttribute("task.id"), toolCall);
                    totalErrors.incrementAndGet();
                    flowFile = session.putAttribute(flowFile, "tool.error", "Tool call missing 'name' field");
                    flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
                    session.transfer(flowFile, REL_FAILURE);
                    return;
                }
                final String arguments = objectMapper.writeValueAsString(toolCall.get("arguments"));

                // Check guardrails if configured
                if (guardrails != null) {
                    final Map<String, String> actionContext = new HashMap<>();
                    actionContext.put("agent.name", flowFile.getAttribute("task.origin_agent"));
                    actionContext.put("task.id", flowFile.getAttribute("task.id"));

                    if (!guardrails.isActionPermitted(toolName, actionContext)) {
                        getLogger().warn("Tool '{}' blocked by guardrails for task {}",
                                toolName, flowFile.getAttribute("task.id"));
                        totalBlocked.incrementAndGet();
                        flowFile = session.putAttribute(flowFile, "tool.name", toolName);
                        flowFile = session.putAttribute(flowFile, "tool.blocked_reason", "guardrails_violation");
                        flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
                        session.transfer(flowFile, REL_UNAUTHORIZED);
                        return;
                    }
                }

                // Execute the tool
                final long startTime = System.currentTimeMillis();
                final String result = toolRegistry.executeTool(toolName, arguments);
                final long executionTime = System.currentTimeMillis() - startTime;
                totalExecutions.incrementAndGet();

                results.add(Map.of(
                        "tool_name", toolName,
                        "result", result,
                        "execution_time_ms", executionTime
                ));

                flowFile = session.putAttribute(flowFile, "tool.name", toolName);
                flowFile = session.putAttribute(flowFile, "tool.result", result);
                flowFile = session.putAttribute(flowFile, "tool.execution_time_ms",
                        String.valueOf(executionTime));

                getLogger().debug("Tool '{}' executed in {}ms for task {}",
                        toolName, executionTime, flowFile.getAttribute("task.id"));
            }

            flowFile = session.putAttribute(flowFile, "tool.total_calls",
                    String.valueOf(results.size()));

            // Write tool results to FlowFile content for next LLM iteration
            final String resultsJson = objectMapper.writeValueAsString(results);
            flowFile = session.write(flowFile, out ->
                    out.write(resultsJson.getBytes(StandardCharsets.UTF_8)));

            session.transfer(flowFile, REL_SUCCESS);
            session.getProvenanceReporter().route(flowFile, REL_SUCCESS.getName(),
                    "Executed " + results.size() + " tool call(s)");

        } catch (ToolRegistryService.ToolExecutionException e) {
            totalErrors.incrementAndGet();
            getLogger().error("Tool execution failed: {} — {}", e.getToolName(), e.getMessage());
            flowFile = session.putAttribute(flowFile, "tool.error", e.getMessage());
            flowFile = session.putAttribute(flowFile, "tool.name", e.getToolName());
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        } catch (Exception e) {
            totalErrors.incrementAndGet();
            getLogger().error("Unexpected error in tool execution for task {}",
                    flowFile.getAttribute("task.id"), e);
            flowFile = session.putAttribute(flowFile, "tool.error",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        }
    }
}
