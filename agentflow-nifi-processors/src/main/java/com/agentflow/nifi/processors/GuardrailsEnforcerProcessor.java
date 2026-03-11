/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.GuardrailsService;
import com.agentflow.nifi.services.GuardrailsService.PIIDetectionResult;
import com.agentflow.nifi.services.GuardrailsService.ValidationResult;
import org.apache.nifi.annotation.behavior.EventDriven;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.ReadsAttribute;
import org.apache.nifi.annotation.behavior.ReadsAttributes;
import org.apache.nifi.annotation.behavior.SideEffectFree;
import org.apache.nifi.annotation.behavior.SupportsBatching;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.SeeAlso;
import org.apache.nifi.annotation.documentation.Tags;
import org.apache.nifi.annotation.lifecycle.OnScheduled;
import org.apache.nifi.annotation.lifecycle.OnStopped;
import org.apache.nifi.components.AllowableValue;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Enforces safety guardrails on agent inputs and outputs. Validates content
 * against configured policies, detects PII, checks token/cost budgets,
 * and optionally redacts sensitive information.
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) for minimum latency</li>
 *   <li>Penalty duration: 30 sec, Yield duration: 1 sec</li>
 *   <li>This is CPU-bound (content analysis) — run duration 25ms for batching</li>
 *   <li>Configure retry count of 10 with PENALIZE_FLOWFILE backoff (10 min max)
 *       on the 'violation' relationship</li>
 *   <li>Place TWO instances of this processor in each agent Process Group:
 *       <ol>
 *         <li>BEFORE the LLMInferenceProcessor (direction=input) — validates prompts</li>
 *         <li>AFTER the LLMInferenceProcessor (direction=output) — validates responses</li>
 *       </ol>
 *   </li>
 *   <li>Define the GuardrailsService Controller Service at root Process Group level
 *       so all agents share the same safety policies</li>
 *   <li>Connect 'violation' to an error handling Process Group</li>
 *   <li>Connect 'budget_exceeded' to a notification/shutdown flow</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "guardrails", "safety", "pii", "content-filter", "compliance", "foundatation"})
@CapabilityDescription(
        "Enforces safety guardrails on agent inputs and outputs. Place before the " +
        "LLM call (input guardrails) and after (output guardrails) in each agent " +
        "Process Group. Validates content policies, detects and optionally redacts " +
        "PII, enforces token/cost budgets, and prevents infinite loops. All violations " +
        "are logged for audit via NiFi's data provenance. " +
        "Recommended: penalty 30 sec, yield 1 sec, run duration 25ms."
)
@SeeAlso({LLMInferenceProcessor.class, HumanInTheLoopProcessor.class, ToolExecutorProcessor.class})
@EventDriven
@SupportsBatching
@SideEffectFree
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier for budget tracking"),
    @ReadsAttribute(attribute = "task.iteration", description = "Current iteration of the agent loop"),
    @ReadsAttribute(attribute = "task.tokens_used", description = "Cumulative tokens used by this task")
})
@WritesAttributes({
    @WritesAttribute(attribute = "guardrails.status", description = "Result: pass, violation, budget_exceeded, error"),
    @WritesAttribute(attribute = "guardrails.violation_type", description = "Type of violation if check failed"),
    @WritesAttribute(attribute = "guardrails.violation_reason", description = "Human-readable reason for the violation"),
    @WritesAttribute(attribute = "guardrails.pii_detected", description = "Comma-separated list of PII types detected"),
    @WritesAttribute(attribute = "guardrails.direction", description = "Whether this check was on 'input' or 'output'"),
    @WritesAttribute(attribute = "guardrails.latency_ms", description = "Guardrails check latency in milliseconds"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'guardrails' on violation for error routing")
})
public class GuardrailsEnforcerProcessor extends AbstractProcessor {

    private static final String ERROR_STAGE = "guardrails";

    // Metrics
    private final AtomicLong totalPassed = new AtomicLong(0);
    private final AtomicLong totalViolations = new AtomicLong(0);
    private final AtomicLong totalBudgetExceeded = new AtomicLong(0);
    private final AtomicLong totalPiiDetected = new AtomicLong(0);

    public static final AllowableValue DIRECTION_INPUT = new AllowableValue(
            "input", "Input", "Check content before LLM call (validate prompts)");
    public static final AllowableValue DIRECTION_OUTPUT = new AllowableValue(
            "output", "Output", "Check content after LLM call (validate responses)");
    public static final AllowableValue DIRECTION_BOTH = new AllowableValue(
            "both", "Both", "Check in both directions — use when a single instance handles both");

    public static final AllowableValue PII_ACTION_BLOCK = new AllowableValue(
            "block", "Block", "Block FlowFiles containing PII — route to violation");
    public static final AllowableValue PII_ACTION_REDACT = new AllowableValue(
            "redact", "Redact", "Redact PII and continue processing");
    public static final AllowableValue PII_ACTION_WARN = new AllowableValue(
            "warn", "Warn", "Log a warning but continue — use only in dev/test");

    public static final PropertyDescriptor GUARDRAILS_SERVICE = new PropertyDescriptor.Builder()
            .name("guardrails-service")
            .displayName("Guardrails Service")
            .description("The controller service providing guardrails configuration and validation. "
                    + "Define at root Process Group level so all agents share the same safety policies.")
            .required(true)
            .identifiesControllerService(GuardrailsService.class)
            .build();

    public static final PropertyDescriptor CHECK_DIRECTION = new PropertyDescriptor.Builder()
            .name("check-direction")
            .displayName("Check Direction")
            .description("Whether to validate input (to LLM), output (from LLM), or both. "
                    + "Best practice: use separate processor instances for input and output checks.")
            .required(true)
            .allowableValues(DIRECTION_INPUT, DIRECTION_OUTPUT, DIRECTION_BOTH)
            .defaultValue(DIRECTION_BOTH.getValue())
            .build();

    public static final PropertyDescriptor PII_ACTION = new PropertyDescriptor.Builder()
            .name("pii-action")
            .displayName("PII Action")
            .description("What to do when PII is detected. 'Block' is safest for production. "
                    + "'Redact' allows processing to continue with PII removed. "
                    + "'Warn' should only be used in development/testing.")
            .required(false)
            .allowableValues(PII_ACTION_BLOCK, PII_ACTION_REDACT, PII_ACTION_WARN)
            .defaultValue(PII_ACTION_REDACT.getValue())
            .build();

    public static final PropertyDescriptor MAX_ITERATIONS = new PropertyDescriptor.Builder()
            .name("max-iterations")
            .displayName("Max Loop Iterations")
            .description("Maximum number of agent loop iterations before halting. "
                    + "Prevents infinite loops. Similar to NiFi's back-pressure concept.")
            .required(false)
            .defaultValue("25")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor MAX_TOKEN_BUDGET = new PropertyDescriptor.Builder()
            .name("max-token-budget")
            .displayName("Max Token Budget")
            .description("Maximum total tokens a single task can consume across all LLM calls. "
                    + "Set to 0 to disable budget checking. Supports Expression Language.")
            .required(false)
            .defaultValue("100000")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_NEGATIVE_INTEGER_VALIDATOR)
            .build();

    public static final Relationship REL_PASS = new Relationship.Builder()
            .name("pass")
            .description("Content passed all guardrails checks — continue processing.")
            .build();

    public static final Relationship REL_VIOLATION = new Relationship.Builder()
            .name("violation")
            .description("Content violated a guardrails policy. Route to error handling.")
            .build();

    public static final Relationship REL_BUDGET_EXCEEDED = new Relationship.Builder()
            .name("budget_exceeded")
            .description("Token or iteration budget has been exceeded. Route to notification/shutdown.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            GUARDRAILS_SERVICE, CHECK_DIRECTION, PII_ACTION,
            MAX_ITERATIONS, MAX_TOKEN_BUDGET
    );

    private final Set<Relationship> relationships = Set.of(
            REL_PASS, REL_VIOLATION, REL_BUDGET_EXCEEDED
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
        totalPassed.set(0);
        totalViolations.set(0);
        totalBudgetExceeded.set(0);
        totalPiiDetected.set(0);
        getLogger().info("GuardrailsEnforcerProcessor scheduled — direction: {}, PII action: {}, "
                        + "max iterations: {}, token budget: {}",
                context.getProperty(CHECK_DIRECTION).getValue(),
                context.getProperty(PII_ACTION).getValue(),
                context.getProperty(MAX_ITERATIONS).getValue(),
                context.getProperty(MAX_TOKEN_BUDGET).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("GuardrailsEnforcerProcessor stopped — passed: {}, violations: {}, "
                        + "budget exceeded: {}, PII detected: {}",
                totalPassed.get(), totalViolations.get(),
                totalBudgetExceeded.get(), totalPiiDetected.get());
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
        final int maxIterations = Integer.parseInt(
                context.getProperty(MAX_ITERATIONS)
                        .evaluateAttributeExpressions(flowFile).getValue());
        final long maxTokenBudget = Long.parseLong(
                context.getProperty(MAX_TOKEN_BUDGET)
                        .evaluateAttributeExpressions(flowFile).getValue());

        final long startTime = System.currentTimeMillis();

        try {
            // Read FlowFile content
            final ByteArrayOutputStream baos = new ByteArrayOutputStream();
            session.exportTo(flowFile, baos);
            final String content = baos.toString(StandardCharsets.UTF_8);

            flowFile = session.putAttribute(flowFile, "guardrails.direction", direction);

            // Check 1: Iteration count (prevent infinite loops)
            final String iterationStr = flowFile.getAttribute("task.iteration");
            if (iterationStr != null) {
                final int iteration = Integer.parseInt(iterationStr);
                if (iteration > maxIterations) {
                    final long latencyMs = System.currentTimeMillis() - startTime;
                    totalBudgetExceeded.incrementAndGet();
                    getLogger().warn("Max iterations ({}) exceeded for task {} (iteration={})",
                            maxIterations, flowFile.getAttribute("task.id"), iteration);

                    final Map<String, String> attrs = new HashMap<>();
                    attrs.put("guardrails.status", "budget_exceeded");
                    attrs.put("guardrails.violation_reason",
                            "Max iterations exceeded: " + iteration + " > " + maxIterations);
                    attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
                    attrs.put("error_stage", ERROR_STAGE);
                    flowFile = session.putAllAttributes(flowFile, attrs);
                    session.transfer(flowFile, REL_BUDGET_EXCEEDED);
                    session.getProvenanceReporter().route(flowFile, REL_BUDGET_EXCEEDED.getName(),
                            "Max iterations exceeded: " + iteration);
                    return;
                }
            }

            // Check 2: Token budget
            if (maxTokenBudget > 0) {
                final String tokensUsedStr = flowFile.getAttribute("task.tokens_used");
                if (tokensUsedStr != null) {
                    final long tokensUsed = Long.parseLong(tokensUsedStr);
                    if (tokensUsed > maxTokenBudget) {
                        final long latencyMs = System.currentTimeMillis() - startTime;
                        totalBudgetExceeded.incrementAndGet();
                        getLogger().warn("Token budget exceeded for task {}: {} > {}",
                                flowFile.getAttribute("task.id"), tokensUsed, maxTokenBudget);

                        final Map<String, String> attrs = new HashMap<>();
                        attrs.put("guardrails.status", "budget_exceeded");
                        attrs.put("guardrails.violation_reason",
                                "Token budget exceeded: " + tokensUsed + " > " + maxTokenBudget);
                        attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
                        attrs.put("error_stage", ERROR_STAGE);
                        flowFile = session.putAllAttributes(flowFile, attrs);
                        session.transfer(flowFile, REL_BUDGET_EXCEEDED);
                        session.getProvenanceReporter().route(flowFile, REL_BUDGET_EXCEEDED.getName(),
                                "Token budget exceeded: " + tokensUsed);
                        return;
                    }
                }
            }

            // Check 3: Content policy validation via GuardrailsService
            final ValidationResult validationResult = guardrails.validateContent(content, direction);
            if (!validationResult.passed()) {
                final long latencyMs = System.currentTimeMillis() - startTime;
                totalViolations.incrementAndGet();

                final Map<String, String> attrs = new HashMap<>();
                attrs.put("guardrails.status", "violation");
                attrs.put("guardrails.violation_type", validationResult.violationType());
                attrs.put("guardrails.violation_reason", validationResult.reason());
                attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
                attrs.put("error_stage", ERROR_STAGE);
                flowFile = session.putAllAttributes(flowFile, attrs);
                session.transfer(flowFile, REL_VIOLATION);
                session.getProvenanceReporter().route(flowFile, REL_VIOLATION.getName(),
                        "Policy violation: " + validationResult.violationType());
                return;
            }

            // Check 4: PII detection
            final PIIDetectionResult piiResult = guardrails.detectPII(content);
            if (piiResult.containsPII()) {
                totalPiiDetected.incrementAndGet();
                final String piiTypes = String.join(",", piiResult.detectedTypes());
                flowFile = session.putAttribute(flowFile, "guardrails.pii_detected", piiTypes);

                switch (piiAction) {
                    case "block" -> {
                        final long latencyMs = System.currentTimeMillis() - startTime;
                        totalViolations.incrementAndGet();

                        final Map<String, String> attrs = new HashMap<>();
                        attrs.put("guardrails.status", "violation");
                        attrs.put("guardrails.violation_type", "pii_detected");
                        attrs.put("guardrails.violation_reason", "PII detected: " + piiTypes);
                        attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
                        attrs.put("error_stage", ERROR_STAGE);
                        flowFile = session.putAllAttributes(flowFile, attrs);
                        session.transfer(flowFile, REL_VIOLATION);
                        session.getProvenanceReporter().route(flowFile, REL_VIOLATION.getName(),
                                "PII blocked: " + piiTypes);
                        return;
                    }
                    case "redact" -> {
                        // Replace content with redacted version
                        final String redacted = piiResult.redactedText();
                        flowFile = session.write(flowFile, out ->
                                out.write(redacted.getBytes(StandardCharsets.UTF_8)));
                        getLogger().info("PII redacted from {} content for task {}: {}",
                                direction, flowFile.getAttribute("task.id"), piiTypes);
                    }
                    case "warn" -> {
                        getLogger().warn("PII detected in {} content for task {} (warn mode): {}",
                                direction, flowFile.getAttribute("task.id"), piiTypes);
                    }
                }
            }

            // All checks passed
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalPassed.incrementAndGet();

            final Map<String, String> attrs = new HashMap<>();
            attrs.put("guardrails.status", "pass");
            attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAllAttributes(flowFile, attrs);
            session.transfer(flowFile, REL_PASS);

        } catch (Exception e) {
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalViolations.incrementAndGet();
            getLogger().error("Guardrails check failed for task {} after {}ms",
                    flowFile.getAttribute("task.id"), latencyMs, e);

            final Map<String, String> attrs = new HashMap<>();
            attrs.put("guardrails.status", "error");
            attrs.put("guardrails.violation_reason",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            attrs.put("guardrails.latency_ms", String.valueOf(latencyMs));
            attrs.put("error_stage", ERROR_STAGE);
            flowFile = session.putAllAttributes(flowFile, attrs);
            session.transfer(flowFile, REL_VIOLATION);
        }
    }
}
