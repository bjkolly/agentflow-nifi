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

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Sends chat completion requests to a configured LLM provider and enriches the
 * FlowFile with the model's response, token usage, and tool call information.
 *
 * <p>This is the core reasoning processor in an AgentFlow agent Process Group.
 * It reads the conversation history from the FlowFile content, calls the LLM,
 * and routes the result based on the model's finish reason (text response vs.
 * tool call request).</p>
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) for minimum latency</li>
 *   <li>Set penalty duration to 30 sec for rate-limited FlowFiles</li>
 *   <li>Set yield duration to 1 sec — this is an I/O-bound processor</li>
 *   <li>Configure retry count of 10 with YIELD_PROCESSOR backoff (2 min max)
 *       on the 'failure' and 'rate_limit' relationships</li>
 *   <li>Run duration should remain at 0ms (I/O-bound, HTTP calls)</li>
 *   <li>Place a GuardrailsEnforcerProcessor before and after this processor</li>
 *   <li>Connect 'tool_call' output to a ToolExecutorProcessor</li>
 *   <li>Connect 'rate_limit' back to this processor's input with back-pressure
 *       (backPressureObjectThreshold: 10000, backPressureDataSizeThreshold: 1 GB)</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "llm", "inference", "chat", "completion", "claude", "gpt", "foundatation"})
@CapabilityDescription(
        "Sends a chat completion request to a Large Language Model (LLM) via the " +
        "configured LLMClientService. Reads conversation history from the FlowFile " +
        "content (JSON), calls the model, and writes the response back. Routes to " +
        "'success' for text responses, 'tool_call' when the model requests tool " +
        "execution, 'rate_limit' for throttling, and 'failure' on errors. " +
        "Recommended: penalty duration 30 sec, yield duration 1 sec, retry count 10 " +
        "with YIELD_PROCESSOR backoff on failure/rate_limit relationships."
)
@SeeAlso({ToolExecutorProcessor.class, GuardrailsEnforcerProcessor.class, TaskPlannerProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier"),
    @ReadsAttribute(attribute = "task.iteration", description = "Current iteration of the agent loop"),
    @ReadsAttribute(attribute = "task.tokens_used", description = "Cumulative tokens used by this task")
})
@WritesAttributes({
    @WritesAttribute(attribute = "llm.response.text", description = "The text response from the LLM"),
    @WritesAttribute(attribute = "llm.tool_calls", description = "JSON array of tool calls requested by the LLM"),
    @WritesAttribute(attribute = "llm.tokens.input", description = "Number of input tokens consumed"),
    @WritesAttribute(attribute = "llm.tokens.output", description = "Number of output tokens generated"),
    @WritesAttribute(attribute = "llm.model.id", description = "The model identifier used"),
    @WritesAttribute(attribute = "llm.finish_reason", description = "Why the model stopped: 'stop', 'tool_use', 'max_tokens'"),
    @WritesAttribute(attribute = "llm.latency_ms", description = "LLM API call latency in milliseconds"),
    @WritesAttribute(attribute = "llm.error", description = "Error message if the LLM call failed"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'llm-inference' on failure for error routing")
})
public class LLMInferenceProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "llm-inference";

    // Metrics counters (reset on stop)
    private final AtomicLong totalCalls = new AtomicLong(0);
    private final AtomicLong totalInputTokens = new AtomicLong(0);
    private final AtomicLong totalOutputTokens = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);

    // --- Properties ---

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The controller service providing LLM API connectivity. "
                    + "Define this as a shared Controller Service at the root Process Group "
                    + "level so multiple agent Process Groups can reuse the same connection.")
            .required(true)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor MODEL_ID = new PropertyDescriptor.Builder()
            .name("model-id")
            .displayName("Model ID")
            .description("The model identifier (e.g., claude-sonnet-4-6, gpt-4o). "
                    + "Supports Expression Language for dynamic model selection based on "
                    + "task type or routing attributes.")
            .required(true)
            .defaultValue("claude-sonnet-4-6")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor SYSTEM_PROMPT = new PropertyDescriptor.Builder()
            .name("system-prompt")
            .displayName("System Prompt")
            .description("The system prompt defining the agent's role and behavior. "
                    + "Supports Expression Language for dynamic prompts based on task context.")
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor TEMPERATURE = new PropertyDescriptor.Builder()
            .name("temperature")
            .displayName("Temperature")
            .description("Sampling temperature (0.0 = deterministic, 2.0 = maximum randomness). "
                    + "Use 0.0-0.3 for structured/factual tasks, 0.7+ for creative tasks.")
            .required(false)
            .defaultValue("0.7")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_TOKENS = new PropertyDescriptor.Builder()
            .name("max-tokens")
            .displayName("Max Tokens")
            .description("Maximum number of tokens in the model's response. "
                    + "Works with the GuardrailsEnforcer token budget to control costs.")
            .required(false)
            .defaultValue("4096")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor TOOL_DEFINITIONS = new PropertyDescriptor.Builder()
            .name("tool-definitions")
            .displayName("Tool Definitions (JSON)")
            .description(
                    "JSON array of tool/function definitions to pass to the LLM. "
                    + "If empty, the model will not be able to call tools. Use Expression "
                    + "Language to reference tool definitions stored in FlowFile attributes "
                    + "or NiFi Registry parameters."
            )
            .required(false)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor CONNECTION_TIMEOUT = new PropertyDescriptor.Builder()
            .name("connection-timeout")
            .displayName("Connection Timeout")
            .description("Maximum time to wait for establishing a connection to the LLM API. "
                    + "Best practice from Foundatation config: 30 secs.")
            .required(false)
            .defaultValue("30 secs")
            .addValidator(StandardValidators.TIME_PERIOD_VALIDATOR)
            .build();

    public static final PropertyDescriptor SOCKET_READ_TIMEOUT = new PropertyDescriptor.Builder()
            .name("socket-read-timeout")
            .displayName("Socket Read Timeout")
            .description("Maximum time to wait for an LLM response after sending the request. "
                    + "LLM calls can be slow — best practice from Foundatation config: 5 mins.")
            .required(false)
            .defaultValue("5 mins")
            .addValidator(StandardValidators.TIME_PERIOD_VALIDATOR)
            .build();

    // --- Relationships ---

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("The LLM returned a text response (finish_reason=stop). "
                    + "Typically connected to the output port or a GuardrailsEnforcer for output validation.")
            .build();

    public static final Relationship REL_TOOL_CALL = new Relationship.Builder()
            .name("tool_call")
            .description("The LLM requested one or more tool calls (finish_reason=tool_use). "
                    + "Connect to a ToolExecutorProcessor.")
            .build();

    public static final Relationship REL_RATE_LIMIT = new Relationship.Builder()
            .name("rate_limit")
            .description("The LLM API returned a rate limit error (HTTP 429). "
                    + "Configure retry with YIELD_PROCESSOR backoff, max 2 mins. "
                    + "Can be looped back to this processor's input with back-pressure.")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("The LLM API call failed. Configure retry count of 10 with "
                    + "YIELD_PROCESSOR backoff mechanism, max backoff 2 mins.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            LLM_SERVICE, MODEL_ID, SYSTEM_PROMPT, TEMPERATURE, MAX_TOKENS,
            TOOL_DEFINITIONS, CONNECTION_TIMEOUT, SOCKET_READ_TIMEOUT
    );

    private final Set<Relationship> relationships = Set.of(
            REL_SUCCESS, REL_TOOL_CALL, REL_RATE_LIMIT, REL_FAILURE
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
        totalCalls.set(0);
        totalInputTokens.set(0);
        totalOutputTokens.set(0);
        totalErrors.set(0);

        getLogger().info("LLMInferenceProcessor scheduled — model: {}, connection timeout: {}, read timeout: {}",
                context.getProperty(MODEL_ID).getValue(),
                context.getProperty(CONNECTION_TIMEOUT).getValue(),
                context.getProperty(SOCKET_READ_TIMEOUT).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("LLMInferenceProcessor stopped — total calls: {}, input tokens: {}, "
                        + "output tokens: {}, errors: {}",
                totalCalls.get(), totalInputTokens.get(), totalOutputTokens.get(), totalErrors.get());
    }

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        final LLMClientService llmService = context.getProperty(LLM_SERVICE)
                .asControllerService(LLMClientService.class);
        final String modelId = context.getProperty(MODEL_ID)
                .evaluateAttributeExpressions(flowFile).getValue();
        final String systemPrompt = context.getProperty(SYSTEM_PROMPT)
                .evaluateAttributeExpressions(flowFile).getValue();
        final double temperature = Double.parseDouble(
                context.getProperty(TEMPERATURE)
                        .evaluateAttributeExpressions(flowFile).getValue());
        final int maxTokens = Integer.parseInt(
                context.getProperty(MAX_TOKENS)
                        .evaluateAttributeExpressions(flowFile).getValue());
        final String toolDefs = context.getProperty(TOOL_DEFINITIONS).isSet()
                ? context.getProperty(TOOL_DEFINITIONS).evaluateAttributeExpressions(flowFile).getValue()
                : null;

        final long startTime = System.currentTimeMillis();

        try {
            // Read conversation history from FlowFile content
            final ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            final String contentJson = baos.toString(StandardCharsets.UTF_8);

            final List<Map<String, String>> messages = new ArrayList<>();

            // Add system prompt
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Parse existing conversation from FlowFile content
            if (!contentJson.isEmpty()) {
                try {
                    final Map<String, Object> taskPayload = objectMapper.readValue(
                            contentJson, new TypeReference<>() {});
                    final Object history = taskPayload.get("conversation_history");
                    if (history instanceof List<?>) {
                        @SuppressWarnings("unchecked")
                        final List<Map<String, String>> existingMessages =
                                (List<Map<String, String>>) history;
                        messages.addAll(existingMessages);
                    }
                } catch (Exception e) {
                    // If content is plain text, treat as a user message
                    messages.add(Map.of("role", "user", "content", contentJson));
                }
            }

            // Call the LLM
            final Map<String, Object> response = llmService.chatCompletion(
                    messages, modelId, temperature, maxTokens, toolDefs);

            final long latencyMs = System.currentTimeMillis() - startTime;
            totalCalls.incrementAndGet();

            // Extract response fields
            final String responseText = extractString(response, "content", "");
            final String finishReason = extractString(response, "finish_reason", "stop");
            final String toolCalls = extractToolCalls(response);

            // Extract token usage
            @SuppressWarnings("unchecked")
            final Map<String, Object> usage =
                    (Map<String, Object>) response.getOrDefault("usage", Map.of());
            final long inputTokens = toLong(usage.getOrDefault("input_tokens", "0"));
            final long outputTokens = toLong(usage.getOrDefault("output_tokens", "0"));
            totalInputTokens.addAndGet(inputTokens);
            totalOutputTokens.addAndGet(outputTokens);

            // Write attributes (consistent dot-notation naming per Foundatation conventions)
            final Map<String, String> attrs = new HashMap<>();
            attrs.put("llm.response.text", responseText);
            attrs.put("llm.finish_reason", finishReason);
            attrs.put("llm.model.id", modelId);
            attrs.put("llm.tokens.input", String.valueOf(inputTokens));
            attrs.put("llm.tokens.output", String.valueOf(outputTokens));
            attrs.put("llm.latency_ms", String.valueOf(latencyMs));

            if (toolCalls != null && !toolCalls.isEmpty()) {
                attrs.put("llm.tool_calls", toolCalls);
            }

            // Update cumulative token count for budget tracking
            final String prevTokens = flowFile.getAttribute("task.tokens_used");
            final long cumulativeTokens = (prevTokens != null ? Long.parseLong(prevTokens) : 0)
                    + inputTokens + outputTokens;
            attrs.put("task.tokens_used", String.valueOf(cumulativeTokens));

            flowFile = session.putAllAttributes(flowFile, attrs);

            // Update FlowFile content with the response appended to conversation
            final String updatedContent = appendToConversation(contentJson, responseText, toolCalls);
            flowFile = session.write(flowFile, out ->
                    out.write(updatedContent.getBytes(StandardCharsets.UTF_8)));

            // Route based on finish reason
            if ("tool_use".equals(finishReason) || "function_call".equals(finishReason)) {
                session.transfer(flowFile, REL_TOOL_CALL);
                session.getProvenanceReporter().route(flowFile, REL_TOOL_CALL.getName(),
                        "LLM requested tool call(s), latency=" + latencyMs + "ms");
            } else {
                session.transfer(flowFile, REL_SUCCESS);
                session.getProvenanceReporter().route(flowFile, REL_SUCCESS.getName(),
                        "LLM response received, tokens=" + (inputTokens + outputTokens)
                                + ", latency=" + latencyMs + "ms");
            }

        } catch (LLMClientService.LLMClientException e) {
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalErrors.incrementAndGet();

            flowFile = session.putAttribute(flowFile, "llm.error", e.getMessage());
            flowFile = session.putAttribute(flowFile, "llm.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);

            if (e.getMessage() != null && e.getMessage().contains("429")) {
                getLogger().warn("LLM rate limited for task {} after {}ms",
                        flowFile.getAttribute("task.id"), latencyMs);
                session.transfer(flowFile, REL_RATE_LIMIT);
                session.penalize(flowFile);
            } else {
                getLogger().error("LLM inference failed for task {} after {}ms: {}",
                        flowFile.getAttribute("task.id"), latencyMs, e.getMessage());
                session.transfer(flowFile, REL_FAILURE);
            }
        } catch (Exception e) {
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalErrors.incrementAndGet();

            getLogger().error("Unexpected error in LLM inference after {}ms", latencyMs, e);
            flowFile = session.putAttribute(flowFile, "llm.error",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            flowFile = session.putAttribute(flowFile, "llm.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private String extractString(Map<String, Object> map, String key, String defaultValue) {
        final Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private long toLong(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private String extractToolCalls(Map<String, Object> response) {
        try {
            final Object toolCalls = response.get("tool_calls");
            if (toolCalls != null) {
                return objectMapper.writeValueAsString(toolCalls);
            }
        } catch (Exception e) {
            getLogger().warn("Failed to extract tool calls from response", e);
        }
        return null;
    }

    private String appendToConversation(String existingContent, String responseText, String toolCalls) {
        try {
            Map<String, Object> payload;
            if (existingContent != null && !existingContent.isEmpty()) {
                payload = objectMapper.readValue(existingContent, new TypeReference<>() {});
            } else {
                payload = new HashMap<>();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, String>> history = (List<Map<String, String>>)
                    payload.computeIfAbsent("conversation_history", k -> new ArrayList<>());

            history.add(Map.of("role", "assistant", "content",
                    responseText != null ? responseText : ""));

            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            getLogger().warn("Failed to update conversation history", e);
            return existingContent;
        }
    }
}
