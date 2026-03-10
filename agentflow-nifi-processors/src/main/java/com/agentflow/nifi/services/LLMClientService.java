/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.services;

import org.apache.nifi.controller.ControllerService;

import java.util.List;
import java.util.Map;

/**
 * Controller Service interface for managing connections to Large Language Model
 * (LLM) providers such as Anthropic Claude, OpenAI GPT, AWS Bedrock, and Ollama.
 *
 * <p>This service is shared across multiple processors within an agent Process Group,
 * providing connection pooling, rate limiting, and model configuration.</p>
 */
public interface LLMClientService extends ControllerService {

    /**
     * Sends a chat completion request to the configured LLM provider.
     *
     * @param messages     the conversation history as a list of role/content maps
     * @param model        the model identifier (e.g., "claude-sonnet-4-6", "gpt-4o")
     * @param temperature  sampling temperature (0.0 - 2.0)
     * @param maxTokens    maximum tokens in the response
     * @param tools        optional tool/function definitions (JSON array), may be null
     * @return the LLM response as a structured map containing "content", "tool_calls",
     *         "usage" (input/output tokens), and "finish_reason"
     * @throws LLMClientException if the API call fails
     */
    Map<String, Object> chatCompletion(
            List<Map<String, String>> messages,
            String model,
            double temperature,
            int maxTokens,
            String tools
    ) throws LLMClientException;

    /**
     * Returns the name of the configured LLM provider.
     *
     * @return provider name (e.g., "anthropic", "openai", "bedrock", "ollama")
     */
    String getProviderName();

    /**
     * Tests connectivity to the LLM provider endpoint.
     *
     * @return true if the provider is reachable and authenticated
     */
    boolean testConnection();

    /**
     * Exception type for LLM client errors.
     */
    class LLMClientException extends Exception {
        public LLMClientException(String message) {
            super(message);
        }

        public LLMClientException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
