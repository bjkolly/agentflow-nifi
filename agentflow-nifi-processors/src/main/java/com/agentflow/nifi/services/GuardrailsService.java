/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.services;

import org.apache.nifi.controller.ControllerService;

import java.util.Map;

/**
 * Controller Service interface for enforcing safety guardrails on agent
 * inputs, outputs, and actions.
 *
 * <p>Provides content filtering, PII detection, cost/token budget enforcement,
 * action boundary validation, and audit logging for agent operations.</p>
 */
public interface GuardrailsService extends ControllerService {

    /**
     * Validates content against configured safety policies.
     *
     * @param content   the text content to validate
     * @param direction whether this is "input" (to LLM) or "output" (from LLM)
     * @return a validation result containing pass/fail status and details
     */
    ValidationResult validateContent(String content, String direction);

    /**
     * Checks if a specific action is permitted by the guardrails policy.
     *
     * @param actionName the name of the action (e.g., "send_email", "delete_file")
     * @param context    additional context about the action (agent name, task ID, etc.)
     * @return true if the action is permitted
     */
    boolean isActionPermitted(String actionName, Map<String, String> context);

    /**
     * Checks whether the token budget has been exceeded for a given task.
     *
     * @param taskId     the task identifier
     * @param tokensUsed the number of tokens consumed so far
     * @return true if the budget is still within limits
     */
    boolean isWithinTokenBudget(String taskId, long tokensUsed);

    /**
     * Checks whether the cost budget has been exceeded for a given task.
     *
     * @param taskId   the task identifier
     * @param costUsed the cost consumed so far (in USD)
     * @return true if the budget is still within limits
     */
    boolean isWithinCostBudget(String taskId, double costUsed);

    /**
     * Scans text for personally identifiable information (PII).
     *
     * @param text the text to scan
     * @return a result containing detected PII types and their locations
     */
    PIIDetectionResult detectPII(String text);

    /**
     * Result of a content validation check.
     */
    record ValidationResult(
            boolean passed,
            String reason,
            String violationType
    ) {
        public static ValidationResult pass() {
            return new ValidationResult(true, null, null);
        }

        public static ValidationResult fail(String reason, String violationType) {
            return new ValidationResult(false, reason, violationType);
        }
    }

    /**
     * Result of a PII detection scan.
     */
    record PIIDetectionResult(
            boolean containsPII,
            java.util.List<String> detectedTypes,
            String redactedText
    ) {}
}
