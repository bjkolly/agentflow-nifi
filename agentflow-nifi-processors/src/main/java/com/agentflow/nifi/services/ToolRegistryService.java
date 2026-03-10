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
 * Controller Service interface for managing the registry of tools/functions
 * available to AI agents.
 *
 * <p>Tools can be HTTP APIs, sandboxed code executors, database queries,
 * MCP (Model Context Protocol) servers, or custom Java implementations.
 * The registry provides tool discovery, schema validation, and sandboxed execution.</p>
 */
public interface ToolRegistryService extends ControllerService {

    /**
     * Executes a registered tool by name with the given arguments.
     *
     * @param toolName  the name of the tool to execute
     * @param arguments the tool arguments as a JSON string
     * @return the tool execution result as a string (typically JSON)
     * @throws ToolExecutionException if execution fails or the tool is not found
     */
    String executeTool(String toolName, String arguments) throws ToolExecutionException;

    /**
     * Returns the list of all registered tool names.
     *
     * @return list of tool names
     */
    List<String> getRegisteredToolNames();

    /**
     * Returns the JSON schema definition for a specific tool, formatted for
     * inclusion in LLM tool/function calling payloads.
     *
     * @param toolName the tool name
     * @return JSON schema string defining the tool's parameters
     * @throws ToolExecutionException if the tool is not found
     */
    String getToolSchema(String toolName) throws ToolExecutionException;

    /**
     * Returns all tool definitions as a JSON array suitable for passing
     * directly to an LLM's tool/function calling API.
     *
     * @return JSON array string of all tool definitions
     */
    String getAllToolDefinitions();

    /**
     * Checks if a specific tool is registered and available.
     *
     * @param toolName the tool name to check
     * @return true if the tool is registered
     */
    boolean isToolAvailable(String toolName);

    /**
     * Exception type for tool execution errors.
     */
    class ToolExecutionException extends Exception {
        private final String toolName;

        public ToolExecutionException(String toolName, String message) {
            super(message);
            this.toolName = toolName;
        }

        public ToolExecutionException(String toolName, String message, Throwable cause) {
            super(message, cause);
            this.toolName = toolName;
        }

        public String getToolName() {
            return toolName;
        }
    }
}
