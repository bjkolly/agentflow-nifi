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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Standard implementation of {@link ToolRegistryService} providing a registry
 * of tools/functions that AI agents can invoke.
 */
@Tags({"agentflow", "ai", "tools", "functions", "mcp", "registry"})
@CapabilityDescription(
        "Manages a registry of tools and functions available to AI agents. " +
        "Tools can be HTTP APIs, sandboxed code executors, database queries, " +
        "or MCP (Model Context Protocol) servers. Provides tool discovery, " +
        "schema validation, and sandboxed execution."
)
public class StandardToolRegistryService extends AbstractControllerService implements ToolRegistryService {

    private static final Logger logger = LoggerFactory.getLogger(StandardToolRegistryService.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final PropertyDescriptor TOOL_DEFINITIONS = new PropertyDescriptor.Builder()
            .name("tool-definitions")
            .displayName("Tool Definitions (JSON)")
            .description(
                    "JSON array defining the available tools. Each tool should have 'name', " +
                    "'description', 'type' (http_api, code_executor, sql_query, mcp), " +
                    "'endpoint' (for HTTP tools), and 'parameters' (JSON Schema)."
            )
            .required(true)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor EXECUTION_TIMEOUT = new PropertyDescriptor.Builder()
            .name("execution-timeout")
            .displayName("Execution Timeout (seconds)")
            .description("Maximum time in seconds to wait for a tool execution to complete")
            .required(false)
            .defaultValue("30")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor SANDBOX_ENABLED = new PropertyDescriptor.Builder()
            .name("sandbox-enabled")
            .displayName("Sandbox Mode")
            .description("When enabled, tool executions run in isolated sandboxed environments")
            .required(false)
            .defaultValue("true")
            .allowableValues("true", "false")
            .build();

    private OkHttpClient httpClient;
    private final ConcurrentHashMap<String, Map<String, Object>> toolRegistry = new ConcurrentHashMap<>();
    private int executionTimeout;
    private boolean sandboxEnabled;

    @Override
    protected List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        final List<PropertyDescriptor> properties = new ArrayList<>();
        properties.add(TOOL_DEFINITIONS);
        properties.add(EXECUTION_TIMEOUT);
        properties.add(SANDBOX_ENABLED);
        return Collections.unmodifiableList(properties);
    }

    @OnEnabled
    @SuppressWarnings("unchecked")
    public void onEnabled(final ConfigurationContext context) {
        this.executionTimeout = context.getProperty(EXECUTION_TIMEOUT).asInteger();
        this.sandboxEnabled = context.getProperty(SANDBOX_ENABLED).asBoolean();

        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(executionTimeout, TimeUnit.SECONDS)
                .build();

        // Parse and register tools from the JSON configuration
        String toolDefsJson = context.getProperty(TOOL_DEFINITIONS).getValue();
        try {
            List<Map<String, Object>> tools = objectMapper.readValue(toolDefsJson, List.class);
            toolRegistry.clear();
            for (Map<String, Object> tool : tools) {
                String name = (String) tool.get("name");
                if (name != null) {
                    toolRegistry.put(name, tool);
                    logger.info("Registered tool: {}", name);
                }
            }
            logger.info("ToolRegistryService enabled with {} tools (sandbox={})",
                    toolRegistry.size(), sandboxEnabled);
        } catch (Exception e) {
            logger.error("Failed to parse tool definitions JSON", e);
        }
    }

    @OnDisabled
    public void onDisabled() {
        toolRegistry.clear();
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient.connectionPool().evictAll();
        }
        logger.info("ToolRegistryService disabled");
    }

    @Override
    public String executeTool(String toolName, String arguments) throws ToolExecutionException {
        Map<String, Object> toolDef = toolRegistry.get(toolName);
        if (toolDef == null) {
            throw new ToolExecutionException(toolName, "Tool not found: " + toolName);
        }

        String toolType = (String) toolDef.getOrDefault("type", "http_api");
        logger.debug("Executing tool '{}' (type={}, sandbox={})", toolName, toolType, sandboxEnabled);

        try {
            return switch (toolType) {
                case "http_api" -> executeHttpTool(toolDef, arguments);
                case "code_executor" -> executeCodeTool(toolDef, arguments);
                case "sql_query" -> executeSqlTool(toolDef, arguments);
                case "mcp" -> executeMcpTool(toolDef, arguments);
                default -> throw new ToolExecutionException(toolName, "Unknown tool type: " + toolType);
            };
        } catch (ToolExecutionException e) {
            throw e;
        } catch (Exception e) {
            throw new ToolExecutionException(toolName, "Execution failed: " + e.getMessage(), e);
        }
    }

    @Override
    public List<String> getRegisteredToolNames() {
        return new ArrayList<>(toolRegistry.keySet());
    }

    @Override
    public String getToolSchema(String toolName) throws ToolExecutionException {
        Map<String, Object> toolDef = toolRegistry.get(toolName);
        if (toolDef == null) {
            throw new ToolExecutionException(toolName, "Tool not found: " + toolName);
        }
        try {
            return objectMapper.writeValueAsString(toolDef.get("parameters"));
        } catch (Exception e) {
            throw new ToolExecutionException(toolName, "Failed to serialize tool schema", e);
        }
    }

    @Override
    public String getAllToolDefinitions() {
        try {
            List<Map<String, Object>> definitions = new ArrayList<>();
            for (Map.Entry<String, Map<String, Object>> entry : toolRegistry.entrySet()) {
                Map<String, Object> def = new HashMap<>();
                def.put("name", entry.getKey());
                def.put("description", entry.getValue().get("description"));
                def.put("parameters", entry.getValue().get("parameters"));
                definitions.add(def);
            }
            return objectMapper.writeValueAsString(definitions);
        } catch (Exception e) {
            logger.error("Failed to serialize tool definitions", e);
            return "[]";
        }
    }

    @Override
    public boolean isToolAvailable(String toolName) {
        return toolRegistry.containsKey(toolName);
    }

    // --- Private execution methods (to be fully implemented) ---

    private String executeHttpTool(Map<String, Object> toolDef, String arguments) throws Exception {
        String endpoint = (String) toolDef.get("endpoint");
        if (endpoint == null) {
            throw new Exception("No endpoint configured for HTTP tool");
        }

        // TODO: Build and execute HTTP request to the tool endpoint
        Request request = new Request.Builder()
                .url(endpoint)
                .post(RequestBody.create(arguments, JSON))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.body() != null) {
                return response.body().string();
            }
            return "{}";
        }
    }

    private String executeCodeTool(Map<String, Object> toolDef, String arguments) throws Exception {
        // TODO: Execute code in a sandboxed environment (Docker/gVisor)
        logger.warn("Code executor tool is not yet implemented");
        return "{\"error\": \"Code executor not yet implemented\"}";
    }

    private String executeSqlTool(Map<String, Object> toolDef, String arguments) throws Exception {
        // TODO: Execute SQL query via JDBC (read-only)
        logger.warn("SQL query tool is not yet implemented");
        return "{\"error\": \"SQL query tool not yet implemented\"}";
    }

    private String executeMcpTool(Map<String, Object> toolDef, String arguments) throws Exception {
        // TODO: Execute tool via MCP (Model Context Protocol) client
        logger.warn("MCP tool is not yet implemented");
        return "{\"error\": \"MCP tool not yet implemented\"}";
    }
}
