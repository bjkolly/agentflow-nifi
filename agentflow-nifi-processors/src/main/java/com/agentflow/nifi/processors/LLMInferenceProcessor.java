/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.LLMClientService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.ReadsAttribute;
import org.apache.nifi.annotation.behavior.ReadsAttributes;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.annotation.lifecycle.OnScheduled;
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
 * Sends chat completion requests to a configured LLM provider and enriches the
 * FlowFile with the model's response, token usage, and tool call information.
 *
 * <p>This is the core reasoning processor in an AgentFlow agent Process Group.
 * It reads the conversation history from the FlowFile content, calls the LLM,
 * and routes the result based on the model's finish reason (text response vs.
 * tool call request).</p>
 */
@Tags({"agentflow", "ai", "llm", "inference", "chat", "completion", "claude", "gpt"})
@CapabilityDescription(
        "Sends a chat completion request to a Large Language Model (LLM) via the " +
        "configured LLMClientService. Reads conversation history from the FlowFile " +
        "content (JSON), calls the model, and writes the response back. Routes to " +
        "'success' for text responses, 'tool_call' when the model requests tool " +
        "execution, 'rate_limit' for throttling, and 'failure' on errors."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier"),
    @ReadsAttribute(attribute = "task.iteration", description = "Current iteration of the agent loop")
})
@WritesAttributes({
    @WritesAttribute(attribute = "llm.response.text", description = "The text response from the LLM"),
    @WritesAttribute(attribute = "llm.tool_calls", description = "JSON array of tool calls requested by the LLM"),
    @WritesAttribute(attribute = "llm.tokens.input", description = "Number of input tokens consumed"),
    @WritesAttribute(attribute = "llm.tokens.output", description = "Number of output tokens generated"),
    @WritesAttribute(attribute = "llm.model.id", description = "The model identifier used"),
    @WritesAttribute(attribute = "llm.finish_reason", description = "Why the model stopped: 'stop', 'tool_use', 'max_tokens'")
})
public class LLMInferenceProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    // --- Properties ---

    public static final PropertyDescriptor LLM_SERVICE = new PropertyDescriptor.Builder()
            .name("llm-client-service")
            .displayName("LLM Client Service")
            .description("The controller service providing LLM API connectivity")
            .required(true)
            .identifiesControllerService(LLMClientService.class)
            .build();

    public static final PropertyDescriptor MODEL_ID = new PropertyDescriptor.Builder()
            .name("model-id")
            .displayName("Model ID")
            .description("The model identifier (e.g., claude-sonnet-4-6, gpt-4o)")
            .required(true)
            .defaultValue("claude-sonnet-4-6")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor SYSTEM_PROMPT = new PropertyDescriptor.Builder()
            .name("system-prompt")
            .displayName("System Prompt")
            .description("The system prompt defining the agent's role and behavior")
            .required(true)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor TEMPERATURE = new PropertyDescriptor.Builder()
            .name("temperature")
            .displayName("Temperature")
            .description("Sampling temperature (0.0 = deterministic, 2.0 = maximum randomness)")
            .required(false)
            .defaultValue("0.7")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_TOKENS = new PropertyDescriptor.Builder()
            .name("max-tokens")
            .displayName("Max Tokens")
            .description("Maximum number of tokens in the model's response")
            .required(false)
            .defaultValue("4096")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor TOOL_DEFINITIONS = new PropertyDescriptor.Builder()
            .name("tool-definitions")
            .displayName("Tool Definitions (JSON)")
            .description(
                    "JSON array of tool/function definitions to pass to the LLM. " +
                    "If empty, the model will not be able to call tools."
            )
            .required(false)
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    // --- Relationships ---

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("The LLM returned a text response (finish_reason=stop)")
            .build();

    public static final Relationship REL_TOOL_CALL = new Relationship.Builder()
            .name("tool_call")
            .description("The LLM requested one or more tool calls (finish_reason=tool_use)")
            .build();

    public static final Relationship REL_RATE_LIMIT = new Relationship.Builder()
            .name("rate_limit")
            .description("The LLM API returned a rate limit error")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("The LLM API call failed")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(LLM_SERVICE);
        descriptors.add(MODEL_ID);
        descriptors.add(SYSTEM_PROMPT);
        descriptors.add(TEMPERATURE);
        descriptors.add(MAX_TOKENS);
        descriptors.add(TOOL_DEFINITIONS);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_SUCCESS);
        relationships.add(REL_TOOL_CALL);
        relationships.add(REL_RATE_LIMIT);
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

    @OnScheduled
    public void onScheduled(final ProcessContext context) {
        getLogger().info("LLMInferenceProcessor scheduled with model: {}",
                context.getProperty(MODEL_ID).getValue());
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
                context.getProperty(TEMPERATURE).getValue());
        final int maxTokens = context.getProperty(MAX_TOKENS).asInteger();
        final String toolDefs = context.getProperty(TOOL_DEFINITIONS).isSet()
                ? context.getProperty(TOOL_DEFINITIONS).evaluateAttributeExpressions(flowFile).getValue()
                : null;

        try {
            // Read conversation history from FlowFile content
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            String contentJson = baos.toString(StandardCharsets.UTF_8);

            List<Map<String, String>> messages = new ArrayList<>();

            // Add system prompt
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Parse existing conversation from FlowFile content
            if (!contentJson.isEmpty()) {
                try {
                    Map<String, Object> taskPayload = objectMapper.readValue(
                            contentJson, new TypeReference<>() {});
                    Object history = taskPayload.get("conversation_history");
                    if (history instanceof List<?>) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, String>> existingMessages = (List<Map<String, String>>) history;
                        messages.addAll(existingMessages);
                    }
                } catch (Exception e) {
                    // If content is plain text, treat as a user message
                    messages.add(Map.of("role", "user", "content", contentJson));
                }
            }

            // Call the LLM
            Map<String, Object> response = llmService.chatCompletion(
                    messages, modelId, temperature, maxTokens, toolDefs);

            // Extract response fields
            String responseText = extractString(response, "content", "");
            String finishReason = extractString(response, "finish_reason", "stop");
            String toolCalls = extractToolCalls(response);

            // Extract token usage
            @SuppressWarnings("unchecked")
            Map<String, Object> usage = (Map<String, Object>) response.getOrDefault("usage", Map.of());
            String inputTokens = String.valueOf(usage.getOrDefault("input_tokens", "0"));
            String outputTokens = String.valueOf(usage.getOrDefault("output_tokens", "0"));

            // Write attributes
            flowFile = session.putAttribute(flowFile, "llm.response.text", responseText);
            flowFile = session.putAttribute(flowFile, "llm.finish_reason", finishReason);
            flowFile = session.putAttribute(flowFile, "llm.model.id", modelId);
            flowFile = session.putAttribute(flowFile, "llm.tokens.input", inputTokens);
            flowFile = session.putAttribute(flowFile, "llm.tokens.output", outputTokens);

            if (toolCalls != null && !toolCalls.isEmpty()) {
                flowFile = session.putAttribute(flowFile, "llm.tool_calls", toolCalls);
            }

            // Update FlowFile content with the response appended to conversation
            final String updatedContent = appendToConversation(contentJson, responseText, toolCalls);
            flowFile = session.write(flowFile, out ->
                    out.write(updatedContent.getBytes(StandardCharsets.UTF_8)));

            // Route based on finish reason
            if ("tool_use".equals(finishReason) || "function_call".equals(finishReason)) {
                session.transfer(flowFile, REL_TOOL_CALL);
            } else {
                session.transfer(flowFile, REL_SUCCESS);
            }

        } catch (LLMClientService.LLMClientException e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                flowFile = session.putAttribute(flowFile, "llm.error", e.getMessage());
                session.transfer(flowFile, REL_RATE_LIMIT);
            } else {
                getLogger().error("LLM inference failed", e);
                flowFile = session.putAttribute(flowFile, "llm.error", e.getMessage());
                session.transfer(flowFile, REL_FAILURE);
            }
        } catch (Exception e) {
            getLogger().error("Unexpected error in LLM inference", e);
            flowFile = session.putAttribute(flowFile, "llm.error", e.getMessage());
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private String extractString(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private String extractToolCalls(Map<String, Object> response) {
        try {
            Object toolCalls = response.get("tool_calls");
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
                payload = new java.util.HashMap<>();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, String>> history = (List<Map<String, String>>)
                    payload.computeIfAbsent("conversation_history", k -> new ArrayList<>());

            history.add(Map.of("role", "assistant", "content", responseText != null ? responseText : ""));

            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            getLogger().warn("Failed to update conversation history", e);
            return existingContent;
        }
    }
}
