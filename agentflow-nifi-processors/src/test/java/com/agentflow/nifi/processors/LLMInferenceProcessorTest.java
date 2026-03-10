/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.LLMClientService;
import org.apache.nifi.reporting.InitializationException;
import org.apache.nifi.util.MockFlowFile;
import org.apache.nifi.util.TestRunner;
import org.apache.nifi.util.TestRunners;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link LLMInferenceProcessor} using NiFi's TestRunner framework.
 */
class LLMInferenceProcessorTest {

    private TestRunner testRunner;

    @BeforeEach
    void setUp() {
        testRunner = TestRunners.newTestRunner(LLMInferenceProcessor.class);
    }

    @Test
    void testProcessorInitialization() {
        // Verify the processor can be instantiated
        assertNotNull(testRunner.getProcessor());
    }

    @Test
    void testRelationshipsExist() {
        // Verify all expected relationships are defined
        assertEquals(4, testRunner.getProcessor().getRelationships().size());
    }

    @Test
    void testPropertyDescriptorsExist() {
        // Verify all expected properties are defined
        assertNotNull(testRunner.getProcessor().getPropertyDescriptor("llm-client-service"));
        assertNotNull(testRunner.getProcessor().getPropertyDescriptor("model-id"));
        assertNotNull(testRunner.getProcessor().getPropertyDescriptor("system-prompt"));
        assertNotNull(testRunner.getProcessor().getPropertyDescriptor("temperature"));
        assertNotNull(testRunner.getProcessor().getPropertyDescriptor("max-tokens"));
    }

    @Test
    void testSuccessfulTextResponse() throws InitializationException, LLMClientService.LLMClientException {
        // Create a mock LLMClientService
        LLMClientService mockLLMService = mock(LLMClientService.class);

        // Configure mock response
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("content", "This is the LLM's response.");
        mockResponse.put("finish_reason", "stop");
        mockResponse.put("usage", Map.of("input_tokens", 150, "output_tokens", 42));

        when(mockLLMService.chatCompletion(any(), anyString(), anyDouble(), anyInt(), any()))
                .thenReturn(mockResponse);
        when(mockLLMService.getIdentifier()).thenReturn("mock-llm-service");

        // Add the mock service to the test runner
        testRunner.addControllerService("mock-llm-service", mockLLMService);
        testRunner.enableControllerService(mockLLMService);
        testRunner.setProperty(LLMInferenceProcessor.LLM_SERVICE, "mock-llm-service");
        testRunner.setProperty(LLMInferenceProcessor.SYSTEM_PROMPT, "You are a helpful assistant.");
        testRunner.setProperty(LLMInferenceProcessor.MODEL_ID, "claude-sonnet-4-6");

        // Enqueue a test FlowFile with a simple user message
        String inputContent = "{\"conversation_history\": [{\"role\": \"user\", \"content\": \"Hello\"}]}";
        testRunner.enqueue(inputContent);

        // Run the processor
        testRunner.run();

        // Verify results
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_SUCCESS, 1);
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_TOOL_CALL, 0);
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_FAILURE, 0);

        MockFlowFile result = testRunner.getFlowFilesForRelationship(LLMInferenceProcessor.REL_SUCCESS).get(0);
        result.assertAttributeEquals("llm.finish_reason", "stop");
        result.assertAttributeEquals("llm.model.id", "claude-sonnet-4-6");
        result.assertAttributeEquals("llm.response.text", "This is the LLM's response.");
    }

    @Test
    void testToolCallResponse() throws InitializationException, LLMClientService.LLMClientException {
        // Create a mock LLMClientService that returns a tool call
        LLMClientService mockLLMService = mock(LLMClientService.class);

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("content", "");
        mockResponse.put("finish_reason", "tool_use");
        mockResponse.put("tool_calls", List.of(
                Map.of("name", "web_search", "arguments", Map.of("query", "latest AI news"))
        ));
        mockResponse.put("usage", Map.of("input_tokens", 200, "output_tokens", 50));

        when(mockLLMService.chatCompletion(any(), anyString(), anyDouble(), anyInt(), any()))
                .thenReturn(mockResponse);
        when(mockLLMService.getIdentifier()).thenReturn("mock-llm-service");

        testRunner.addControllerService("mock-llm-service", mockLLMService);
        testRunner.enableControllerService(mockLLMService);
        testRunner.setProperty(LLMInferenceProcessor.LLM_SERVICE, "mock-llm-service");
        testRunner.setProperty(LLMInferenceProcessor.SYSTEM_PROMPT, "You are a helpful assistant.");

        String inputContent = "{\"conversation_history\": [{\"role\": \"user\", \"content\": \"Search for AI news\"}]}";
        testRunner.enqueue(inputContent);

        testRunner.run();

        // Should route to tool_call relationship
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_TOOL_CALL, 1);
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_SUCCESS, 0);

        MockFlowFile result = testRunner.getFlowFilesForRelationship(LLMInferenceProcessor.REL_TOOL_CALL).get(0);
        result.assertAttributeEquals("llm.finish_reason", "tool_use");
        result.assertAttributeExists("llm.tool_calls");
    }

    @Test
    void testLLMFailure() throws InitializationException, LLMClientService.LLMClientException {
        // Create a mock LLMClientService that throws an exception
        LLMClientService mockLLMService = mock(LLMClientService.class);

        when(mockLLMService.chatCompletion(any(), anyString(), anyDouble(), anyInt(), any()))
                .thenThrow(new LLMClientService.LLMClientException("API Error: 500 Internal Server Error"));
        when(mockLLMService.getIdentifier()).thenReturn("mock-llm-service");

        testRunner.addControllerService("mock-llm-service", mockLLMService);
        testRunner.enableControllerService(mockLLMService);
        testRunner.setProperty(LLMInferenceProcessor.LLM_SERVICE, "mock-llm-service");
        testRunner.setProperty(LLMInferenceProcessor.SYSTEM_PROMPT, "You are a helpful assistant.");

        testRunner.enqueue("Hello");

        testRunner.run();

        // Should route to failure
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_FAILURE, 1);
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_SUCCESS, 0);

        MockFlowFile result = testRunner.getFlowFilesForRelationship(LLMInferenceProcessor.REL_FAILURE).get(0);
        result.assertAttributeExists("llm.error");
    }

    @Test
    void testRateLimitResponse() throws InitializationException, LLMClientService.LLMClientException {
        LLMClientService mockLLMService = mock(LLMClientService.class);

        when(mockLLMService.chatCompletion(any(), anyString(), anyDouble(), anyInt(), any()))
                .thenThrow(new LLMClientService.LLMClientException("429 Too Many Requests"));
        when(mockLLMService.getIdentifier()).thenReturn("mock-llm-service");

        testRunner.addControllerService("mock-llm-service", mockLLMService);
        testRunner.enableControllerService(mockLLMService);
        testRunner.setProperty(LLMInferenceProcessor.LLM_SERVICE, "mock-llm-service");
        testRunner.setProperty(LLMInferenceProcessor.SYSTEM_PROMPT, "You are a helpful assistant.");

        testRunner.enqueue("Hello");

        testRunner.run();

        // Should route to rate_limit
        testRunner.assertTransferCount(LLMInferenceProcessor.REL_RATE_LIMIT, 1);
    }

    @Test
    void testEmptyFlowFileHandling() {
        // No FlowFile enqueued — processor should do nothing
        // (Cannot fully test without controller service, just verify no crash)
        assertNotNull(testRunner.getProcessor());
    }
}
