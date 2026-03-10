/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Standard implementation of {@link GuardrailsService} providing content filtering,
 * PII detection, budget enforcement, and action boundary validation.
 */
@Tags({"agentflow", "ai", "guardrails", "safety", "pii", "content-filter", "budget"})
@CapabilityDescription(
        "Enforces safety guardrails on agent inputs, outputs, and actions. " +
        "Provides content policy validation, PII detection and redaction, " +
        "token/cost budget enforcement, prohibited action filtering, and " +
        "comprehensive audit logging."
)
public class StandardGuardrailsService extends AbstractControllerService implements GuardrailsService {

    private static final Logger logger = LoggerFactory.getLogger(StandardGuardrailsService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final PropertyDescriptor TOKEN_BUDGET_PER_TASK = new PropertyDescriptor.Builder()
            .name("token-budget-per-task")
            .displayName("Token Budget Per Task")
            .description("Maximum number of tokens allowed per agent task (0 = unlimited)")
            .required(false)
            .defaultValue("100000")
            .addValidator(StandardValidators.NON_NEGATIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor COST_BUDGET_PER_TASK = new PropertyDescriptor.Builder()
            .name("cost-budget-per-task")
            .displayName("Cost Budget Per Task (USD)")
            .description("Maximum cost in USD allowed per agent task (0 = unlimited)")
            .required(false)
            .defaultValue("5.00")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor PII_DETECTION_ENABLED = new PropertyDescriptor.Builder()
            .name("pii-detection-enabled")
            .displayName("PII Detection Enabled")
            .description("Enable scanning for personally identifiable information")
            .required(false)
            .defaultValue("true")
            .allowableValues("true", "false")
            .build();

    public static final PropertyDescriptor PROHIBITED_ACTIONS = new PropertyDescriptor.Builder()
            .name("prohibited-actions")
            .displayName("Prohibited Actions")
            .description(
                    "Comma-separated list of action names that agents are never allowed to perform " +
                    "(e.g., delete_production_data, send_money, drop_table)"
            )
            .required(false)
            .defaultValue("delete_production_data,drop_table,send_money,rm_rf")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor CONTENT_POLICY_RULES = new PropertyDescriptor.Builder()
            .name("content-policy-rules")
            .displayName("Content Policy Rules (JSON)")
            .description(
                    "JSON array of content policy rules. Each rule has 'pattern' (regex), " +
                    "'action' (block/warn), and 'description'."
            )
            .required(false)
            .defaultValue("[]")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    // PII detection patterns
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b");
    private static final Pattern SSN_PATTERN = Pattern.compile(
            "\\b\\d{3}-\\d{2}-\\d{4}\\b");
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile(
            "\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b");

    private long tokenBudget;
    private double costBudget;
    private boolean piiDetectionEnabled;
    private Set<String> prohibitedActions;
    private final ConcurrentHashMap<String, Long> taskTokenUsage = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Double> taskCostUsage = new ConcurrentHashMap<>();

    @Override
    protected List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        final List<PropertyDescriptor> properties = new ArrayList<>();
        properties.add(TOKEN_BUDGET_PER_TASK);
        properties.add(COST_BUDGET_PER_TASK);
        properties.add(PII_DETECTION_ENABLED);
        properties.add(PROHIBITED_ACTIONS);
        properties.add(CONTENT_POLICY_RULES);
        return Collections.unmodifiableList(properties);
    }

    @OnEnabled
    public void onEnabled(final ConfigurationContext context) {
        this.tokenBudget = context.getProperty(TOKEN_BUDGET_PER_TASK).asLong();
        this.costBudget = Double.parseDouble(context.getProperty(COST_BUDGET_PER_TASK).getValue());
        this.piiDetectionEnabled = context.getProperty(PII_DETECTION_ENABLED).asBoolean();

        String prohibitedStr = context.getProperty(PROHIBITED_ACTIONS).getValue();
        this.prohibitedActions = new HashSet<>();
        if (prohibitedStr != null && !prohibitedStr.isEmpty()) {
            for (String action : prohibitedStr.split(",")) {
                prohibitedActions.add(action.trim().toLowerCase());
            }
        }

        logger.info("GuardrailsService enabled - token budget: {}, cost budget: ${}, PII detection: {}, prohibited actions: {}",
                tokenBudget, costBudget, piiDetectionEnabled, prohibitedActions);
    }

    @OnDisabled
    public void onDisabled() {
        taskTokenUsage.clear();
        taskCostUsage.clear();
        logger.info("GuardrailsService disabled");
    }

    @Override
    public ValidationResult validateContent(String content, String direction) {
        if (content == null || content.isEmpty()) {
            return ValidationResult.pass();
        }

        // Check for PII if detection is enabled
        if (piiDetectionEnabled) {
            PIIDetectionResult piiResult = detectPII(content);
            if (piiResult.containsPII()) {
                logger.warn("PII detected in {} content: types={}", direction, piiResult.detectedTypes());
                return ValidationResult.fail(
                        "PII detected in " + direction + ": " + piiResult.detectedTypes(),
                        "pii_detected"
                );
            }
        }

        // TODO: Apply content policy rules from JSON configuration

        return ValidationResult.pass();
    }

    @Override
    public boolean isActionPermitted(String actionName, Map<String, String> context) {
        if (actionName == null) {
            return true;
        }

        String normalizedAction = actionName.trim().toLowerCase();
        if (prohibitedActions.contains(normalizedAction)) {
            logger.warn("Prohibited action blocked: '{}' (agent={}, task={})",
                    actionName,
                    context != null ? context.get("agent.name") : "unknown",
                    context != null ? context.get("task.id") : "unknown");
            return false;
        }

        return true;
    }

    @Override
    public boolean isWithinTokenBudget(String taskId, long tokensUsed) {
        if (tokenBudget <= 0) {
            return true; // Unlimited
        }

        taskTokenUsage.put(taskId, tokensUsed);

        if (tokensUsed > tokenBudget) {
            logger.warn("Token budget exceeded for task {}: used={}, budget={}",
                    taskId, tokensUsed, tokenBudget);
            return false;
        }

        return true;
    }

    @Override
    public boolean isWithinCostBudget(String taskId, double costUsed) {
        if (costBudget <= 0) {
            return true; // Unlimited
        }

        taskCostUsage.put(taskId, costUsed);

        if (costUsed > costBudget) {
            logger.warn("Cost budget exceeded for task {}: used=${}, budget=${}",
                    taskId, costUsed, costBudget);
            return false;
        }

        return true;
    }

    @Override
    public PIIDetectionResult detectPII(String text) {
        if (text == null || text.isEmpty()) {
            return new PIIDetectionResult(false, Collections.emptyList(), text);
        }

        List<String> detectedTypes = new ArrayList<>();
        String redacted = text;

        // Check for email addresses
        if (EMAIL_PATTERN.matcher(text).find()) {
            detectedTypes.add("email");
            redacted = EMAIL_PATTERN.matcher(redacted).replaceAll("[EMAIL REDACTED]");
        }

        // Check for phone numbers
        if (PHONE_PATTERN.matcher(text).find()) {
            detectedTypes.add("phone");
            redacted = PHONE_PATTERN.matcher(redacted).replaceAll("[PHONE REDACTED]");
        }

        // Check for SSN
        if (SSN_PATTERN.matcher(text).find()) {
            detectedTypes.add("ssn");
            redacted = SSN_PATTERN.matcher(redacted).replaceAll("[SSN REDACTED]");
        }

        // Check for credit card numbers
        if (CREDIT_CARD_PATTERN.matcher(text).find()) {
            detectedTypes.add("credit_card");
            redacted = CREDIT_CARD_PATTERN.matcher(redacted).replaceAll("[CREDIT CARD REDACTED]");
        }

        return new PIIDetectionResult(!detectedTypes.isEmpty(), detectedTypes, redacted);
    }
}
