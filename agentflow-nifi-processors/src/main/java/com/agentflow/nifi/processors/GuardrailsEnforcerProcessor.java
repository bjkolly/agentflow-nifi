/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.GuardrailsService;
import com.agentflow.nifi.services.GuardrailsService.PIIDetectionResult;
import com.agentflow.nifi.services.GuardrailsService.ValidationResult;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.components.AllowableValue;
import org.apache.nifi.components.PropertyDescriptor;
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
import java.util.Set;

/**
 * Enforces safety guardrails on agent inputs and outputs. Validates content
 * against configured policies, detects PII, checks token/cost budgets,
 * and optionally redacts sensitive information.
 */
@Tags({"agentflow", "ai", "guardrails", "safety", "pii", "content-filter", "compliance"})
@CapabilityDescription(
        "Enforces safety guardrails on agent inputs and outputs. Place this processor " +
        "before the LLM call (input guardrails) and after (output guardrails) in each " +
        "agent Process Group. Validates content policies, detects and optionally redacts " +
        "PII, enforces token/cost budgets, and logs violations for audit."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "guardrails.status", description = "Result of guardrails check: pass, violation, budget_exceeded"),
    @WritesAttribute(attribute = "guardrails.violation_type", description = "Type of violation if check failed"),
    @WritesAttribute(attribute = "guardrails.violation_reason", description = "Human-readable reason for the violation"),
    @WritesAttribute(attribute = "guardrails.pii_detected", description = "Comma-separated list of PII types detected"),
    @WritesAttribute(attribute = "guardrails.direction", description = "Whether this check was on 'input' or 'output'")
})
public class GuardrailsEnforcerProcessor extends AbstractProcessor {

    public static final AllowableValue DIRECTION_INPUT = new AllowableValue("input", "Input", "Check content before LLM call");
    public static final AllowableValue DIRECTION_OUTPUT = new AllowableValue("output", "Output", "Check content after LLM call");
    public static final AllowableValue DIRECTION_BOTH = new AllowableValue("both", "Both", "Check in both directions");

    public static final AllowableValue PII_ACTION_BLOCK = new AllowableValue("block", "Block", "Block FlowFiles containing PII");
    public static final AllowableValue PII_ACTION_REDACT = new AllowableValue("redact", "Redact", "Redact PII and continue");
    public static final AllowableValue PII_ACTION_WARN = new AllowableValue("warn", "Warn", "Log a warning but continue");

    public static final PropertyDescriptor GUARDRAILS_SERVICE = new PropertyDescriptor.Builder()
            .name("guardrails-service")
            .displayName("Guardrails Service")
            .description("The controller service providing guardrails configuration and validation")
            .required(true)
            .identifiesControllerService(GuardrailsService.class)
            .build();

    public static final PropertyDescriptor CHECK_DIRECTION = new PropertyDescriptor.Builder()
            .name("check-direction")
            .displayName("Check Direction")
            .description("Whether to validate input (to LLM), output (from LLM), or both")
            .required(true)
            .allowableValues(DIRECTION_INPUT, DIRECTION_OUTPUT, DIRECTION_BOTH)
            .defaultValue(DIRECTION_BOTH.getValue())
            .build();

    public static final PropertyDescriptor PII_ACTION = new PropertyDescriptor.Builder()
            .name("pii-action")
            .displayName("PII Action")
            .description("What to do when PII is detected: block, redact, or warn")
            .required(false)
            .allowableValues(PII_ACTION_BLOCK, PII_ACTION_REDACT, PII_ACTION_WARN)
            .defaultValue(PII_ACTION_REDACT.getValue())
            .build();

    public static final PropertyDescriptor MAX_ITERATIONS = new PropertyDescriptor.Builder()
            .name("max-iterations")
            .displayName("Max Loop Iterations")
            .description("Maximum number of agent loop iterations before halting (prevents infinite loops)")
            .required(false)
            .defaultValue("25")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_PASS = new Relationship.Builder()
            .name("pass")
            .description("Content passed all guardrails checks")
            .build();

    public static final Relationship REL_VIOLATION = new Relationship.Builder()
            .name("violation")
            .description("Content violated a guardrails policy")
            .build();

    public static final Relationship REL_BUDGET_EXCEEDED = new Relationship.Builder()
            .name("budget_exceeded")
            .description("Token or cost budget has been exceeded")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(GUARDRAILS_SERVICE);
        descriptors.add(CHECK_DIRECTION);
        descriptors.add(PII_ACTION);
        descriptors.add(MAX_ITERATIONS);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_PASS);
        relationships.add(REL_VIOLATION);
        relationships.add(REL_BUDGET_EXCEEDED);
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

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        final GuardrailsService guardrails = context.getProperty(GUARDRAILS_SERVICE)
                .asControllerService(GuardrailsService.class);
        final String direction = context.getProperty(CHECK_DIRECTION).getValue();
        final String piiAction = context.getProperty(PII_ACTION).getValue();
        final int maxIterations = context.getProperty(MAX_ITERATIONS).asInteger();

        try {
            // Read FlowFile content
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            String content = baos.toString(StandardCharsets.UTF_8);

            flowFile = session.putAttribute(flowFile, "guardrails.direction", direction);

            // Check iteration count (prevent infinite loops)
            String iterationStr = flowFile.getAttribute("task.iteration");
            if (iterationStr != null) {
                int iteration = Integer.parseInt(iterationStr);
                if (iteration > maxIterations) {
                    getLogger().warn("Max iterations ({}) exceeded for task {}",
                            maxIterations, flowFile.getAttribute("task.id"));
                    flowFile = session.putAttribute(flowFile, "guardrails.status", "budget_exceeded");
                    flowFile = session.putAttribute(flowFile, "guardrails.violation_reason",
                            "Max iterations exceeded: " + iteration + " > " + maxIterations);
                    session.transfer(flowFile, REL_BUDGET_EXCEEDED);
                    return;
                }
            }

            // Check token budget
            String tokensUsedStr = flowFile.getAttribute("task.tokens_used");
            if (tokensUsedStr != null) {
                long tokensUsed = Long.parseLong(tokensUsedStr);
                String taskId = flowFile.getAttribute("task.id");
                if (!guardrails.isWithinTokenBudget(taskId, tokensUsed)) {
                    flowFile = session.putAttribute(flowFile, "guardrails.status", "budget_exceeded");
                    flowFile = session.putAttribute(flowFile, "guardrails.violation_reason",
                            "Token budget exceeded: " + tokensUsed);
                    session.transfer(flowFile, REL_BUDGET_EXCEEDED);
                    return;
                }
            }

            // Validate content
            ValidationResult validationResult = guardrails.validateContent(content, direction);
            if (!validationResult.passed()) {
                flowFile = session.putAttribute(flowFile, "guardrails.status", "violation");
                flowFile = session.putAttribute(flowFile, "guardrails.violation_type",
                        validationResult.violationType());
                flowFile = session.putAttribute(flowFile, "guardrails.violation_reason",
                        validationResult.reason());
                session.transfer(flowFile, REL_VIOLATION);
                return;
            }

            // Check PII
            PIIDetectionResult piiResult = guardrails.detectPII(content);
            if (piiResult.containsPII()) {
                String piiTypes = String.join(",", piiResult.detectedTypes());
                flowFile = session.putAttribute(flowFile, "guardrails.pii_detected", piiTypes);

                switch (piiAction) {
                    case "block":
                        flowFile = session.putAttribute(flowFile, "guardrails.status", "violation");
                        flowFile = session.putAttribute(flowFile, "guardrails.violation_type", "pii_detected");
                        flowFile = session.putAttribute(flowFile, "guardrails.violation_reason",
                                "PII detected: " + piiTypes);
                        session.transfer(flowFile, REL_VIOLATION);
                        return;

                    case "redact":
                        // Replace content with redacted version
                        final String redacted = piiResult.redactedText();
                        flowFile = session.write(flowFile, out ->
                                out.write(redacted.getBytes(StandardCharsets.UTF_8)));
                        getLogger().info("PII redacted from {} content: {}", direction, piiTypes);
                        break;

                    case "warn":
                        getLogger().warn("PII detected in {} content (warn mode): {}", direction, piiTypes);
                        break;
                }
            }

            // All checks passed
            flowFile = session.putAttribute(flowFile, "guardrails.status", "pass");
            session.transfer(flowFile, REL_PASS);

        } catch (Exception e) {
            getLogger().error("Guardrails check failed", e);
            flowFile = session.putAttribute(flowFile, "guardrails.status", "error");
            flowFile = session.putAttribute(flowFile, "guardrails.violation_reason", e.getMessage());
            session.transfer(flowFile, REL_VIOLATION);
        }
    }
}
