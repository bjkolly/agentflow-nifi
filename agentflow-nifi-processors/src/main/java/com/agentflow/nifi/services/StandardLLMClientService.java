/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.annotation.lifecycle.OnDisabled;
import org.apache.nifi.annotation.lifecycle.OnEnabled;
import org.apache.nifi.components.AllowableValue;
import org.apache.nifi.components.PropertyDescriptor;
import org.apache.nifi.controller.AbstractControllerService;
import org.apache.nifi.controller.ConfigurationContext;
import org.apache.nifi.processor.util.StandardValidators;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Standard implementation of {@link LLMClientService} providing connectivity
 * to LLM providers (Anthropic, OpenAI, AWS Bedrock, Ollama).
 */
@Tags({"agentflow", "ai", "llm", "claude", "openai", "bedrock", "ollama"})
@CapabilityDescription(
        "Manages connections to Large Language Model (LLM) providers. Supports " +
        "Anthropic Claude, OpenAI GPT, AWS Bedrock, and Ollama (local). Provides " +
        "connection pooling, retry logic, and rate limiting across all processors " +
        "that reference this service."
)
public class StandardLLMClientService extends AbstractControllerService implements LLMClientService {

    private static final Logger logger = LoggerFactory.getLogger(StandardLLMClientService.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final AllowableValue PROVIDER_ANTHROPIC = new AllowableValue("anthropic", "Anthropic", "Anthropic Claude API");
    public static final AllowableValue PROVIDER_OPENAI = new AllowableValue("openai", "OpenAI", "OpenAI GPT API");
    public static final AllowableValue PROVIDER_BEDROCK = new AllowableValue("bedrock", "AWS Bedrock", "AWS Bedrock API");
    public static final AllowableValue PROVIDER_OLLAMA = new AllowableValue("ollama", "Ollama", "Local Ollama instance");

    public static final PropertyDescriptor PROVIDER = new PropertyDescriptor.Builder()
            .name("llm-provider")
            .displayName("LLM Provider")
            .description("The LLM provider to connect to")
            .required(true)
            .allowableValues(PROVIDER_ANTHROPIC, PROVIDER_OPENAI, PROVIDER_BEDROCK, PROVIDER_OLLAMA)
            .defaultValue(PROVIDER_ANTHROPIC.getValue())
            .build();

    public static final PropertyDescriptor BASE_URL = new PropertyDescriptor.Builder()
            .name("base-url")
            .displayName("Base URL")
            .description("The base URL of the LLM API endpoint")
            .required(true)
            .defaultValue("https://api.anthropic.com")
            .addValidator(StandardValidators.URL_VALIDATOR)
            .build();

    public static final PropertyDescriptor API_KEY = new PropertyDescriptor.Builder()
            .name("api-key")
            .displayName("API Key")
            .description("API key for authenticating with the LLM provider")
            .required(true)
            .sensitive(true)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor CONNECTION_TIMEOUT = new PropertyDescriptor.Builder()
            .name("connection-timeout")
            .displayName("Connection Timeout (seconds)")
            .description("Maximum time to wait for a connection to be established")
            .required(false)
            .defaultValue("30")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor READ_TIMEOUT = new PropertyDescriptor.Builder()
            .name("read-timeout")
            .displayName("Read Timeout (seconds)")
            .description("Maximum time to wait for a response from the LLM")
            .required(false)
            .defaultValue("120")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_RETRIES = new PropertyDescriptor.Builder()
            .name("max-retries")
            .displayName("Max Retries")
            .description("Maximum number of retry attempts for failed API calls")
            .required(false)
            .defaultValue("3")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    private OkHttpClient httpClient;
    private String provider;
    private String baseUrl;
    private String apiKey;
    private int maxRetries;

    @Override
    protected List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        final List<PropertyDescriptor> properties = new ArrayList<>();
        properties.add(PROVIDER);
        properties.add(BASE_URL);
        properties.add(API_KEY);
        properties.add(CONNECTION_TIMEOUT);
        properties.add(READ_TIMEOUT);
        properties.add(MAX_RETRIES);
        return Collections.unmodifiableList(properties);
    }

    @OnEnabled
    public void onEnabled(final ConfigurationContext context) {
        this.provider = context.getProperty(PROVIDER).getValue();
        this.baseUrl = context.getProperty(BASE_URL).getValue();
        this.apiKey = context.getProperty(API_KEY).getValue();
        this.maxRetries = context.getProperty(MAX_RETRIES).asInteger();

        int connectTimeout = context.getProperty(CONNECTION_TIMEOUT).asInteger();
        int readTimeout = context.getProperty(READ_TIMEOUT).asInteger();

        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(connectTimeout, TimeUnit.SECONDS)
                .readTimeout(readTimeout, TimeUnit.SECONDS)
                .build();

        logger.info("LLMClientService enabled for provider: {} at {}", provider, baseUrl);
    }

    @OnDisabled
    public void onDisabled() {
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient.connectionPool().evictAll();
        }
        logger.info("LLMClientService disabled");
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> chatCompletion(
            List<Map<String, String>> messages,
            String model,
            double temperature,
            int maxTokens,
            String tools
    ) throws LLMClientException {
        try {
            // Build the request body based on the provider
            Map<String, Object> requestBody = buildRequestBody(messages, model, temperature, maxTokens, tools);
            String jsonBody = objectMapper.writeValueAsString(requestBody);

            // Build HTTP request with provider-specific headers
            Request.Builder requestBuilder = new Request.Builder()
                    .url(buildEndpointUrl())
                    .post(RequestBody.create(jsonBody, JSON));

            addAuthHeaders(requestBuilder);

            // Execute with retry logic
            for (int attempt = 0; attempt <= maxRetries; attempt++) {
                try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
                    if (response.isSuccessful() && response.body() != null) {
                        String responseBody = response.body().string();
                        return objectMapper.readValue(responseBody, Map.class);
                    }

                    if (response.code() == 429 && attempt < maxRetries) {
                        // Rate limited - exponential backoff
                        long waitMs = (long) Math.pow(2, attempt) * 1000;
                        logger.warn("Rate limited by {} API. Retrying in {}ms (attempt {}/{})",
                                provider, waitMs, attempt + 1, maxRetries);
                        Thread.sleep(waitMs);
                        continue;
                    }

                    throw new LLMClientException(String.format(
                            "LLM API returned status %d: %s",
                            response.code(),
                            response.body() != null ? response.body().string() : "no body"
                    ));
                }
            }

            throw new LLMClientException("Max retries exceeded for LLM API call");

        } catch (LLMClientException e) {
            throw e;
        } catch (Exception e) {
            throw new LLMClientException("Failed to call LLM API: " + e.getMessage(), e);
        }
    }

    @Override
    public String getProviderName() {
        return provider;
    }

    @Override
    public boolean testConnection() {
        // TODO: Implement provider-specific health check
        logger.debug("Testing connection to {} at {}", provider, baseUrl);
        return httpClient != null;
    }

    private Map<String, Object> buildRequestBody(
            List<Map<String, String>> messages,
            String model,
            double temperature,
            int maxTokens,
            String tools
    ) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);

        switch (provider) {
            case "anthropic":
                body.put("max_tokens", maxTokens);
                body.put("messages", messages);
                if (tools != null && !tools.isEmpty()) {
                    body.put("tools", objectMapper.readValue(tools, List.class));
                }
                break;
            case "openai":
                body.put("max_tokens", maxTokens);
                body.put("messages", messages);
                if (tools != null && !tools.isEmpty()) {
                    body.put("functions", objectMapper.readValue(tools, List.class));
                }
                break;
            default:
                body.put("max_tokens", maxTokens);
                body.put("messages", messages);
                break;
        }

        return body;
    }

    private String buildEndpointUrl() {
        return switch (provider) {
            case "anthropic" -> baseUrl + "/v1/messages";
            case "openai" -> baseUrl + "/v1/chat/completions";
            case "ollama" -> baseUrl + "/api/chat";
            default -> baseUrl + "/v1/chat/completions";
        };
    }

    private void addAuthHeaders(Request.Builder builder) {
        switch (provider) {
            case "anthropic":
                builder.addHeader("x-api-key", apiKey);
                builder.addHeader("anthropic-version", "2024-01-01");
                builder.addHeader("Content-Type", "application/json");
                break;
            case "openai":
                builder.addHeader("Authorization", "Bearer " + apiKey);
                builder.addHeader("Content-Type", "application/json");
                break;
            default:
                builder.addHeader("Authorization", "Bearer " + apiKey);
                builder.addHeader("Content-Type", "application/json");
                break;
        }
    }
}
