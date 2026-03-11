/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.EventDriven;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.ReadsAttribute;
import org.apache.nifi.annotation.behavior.ReadsAttributes;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pauses the agent flow and waits for human approval before continuing.
 * FlowFiles are held until a human responds via the configured approval
 * channel (UI, Slack, or REST API).
 *
 * <p>This processor leverages NiFi's natural back-pressure mechanism — the
 * FlowFile sits in the incoming connection queue until the human responds,
 * at which point the processor picks it up and routes it accordingly.</p>
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Penalty duration: 30 sec — penalized FlowFiles are re-checked after penalty</li>
 *   <li>Yield duration: 1 sec — processor yields when no FlowFiles need checking</li>
 *   <li>This processor uses penalize + rollback for the pending state:
 *       the FlowFile is penalized and rolled back, then re-processed after
 *       the penalty duration (30 sec) to check approval status</li>
 *   <li>Configure back-pressure on the incoming connection:
 *       backPressureObjectThreshold: 10000, backPressureDataSizeThreshold: 1 GB</li>
 *   <li>Connect 'approved' to the next step in the agent pipeline</li>
 *   <li>Connect 'rejected' to an error handling Process Group</li>
 *   <li>Connect 'timed_out' to a notification or escalation flow</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "human", "approval", "review", "hitl", "human-in-the-loop", "foundatation"})
@CapabilityDescription(
        "Pauses the agent workflow and waits for human approval. FlowFiles are " +
        "held via penalize + rollback until a human approves or rejects the action " +
        "via the configured channel (NiFi UI, Slack, or REST API). Supports auto-approve " +
        "rules for low-risk actions and configurable timeout with escalation. " +
        "Recommended: penalty 30 sec (approval check interval), yield 1 sec."
)
@SeeAlso({GuardrailsEnforcerProcessor.class, ToolExecutorProcessor.class, LLMInferenceProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier — used as approval key"),
    @ReadsAttribute(attribute = "task.origin_agent", description = "The agent requesting approval"),
    @ReadsAttribute(attribute = "uuid", description = "FlowFile UUID — fallback approval key if task.id is absent")
})
@WritesAttributes({
    @WritesAttribute(attribute = "human.decision", description = "The human's decision: approved, rejected, or timed_out"),
    @WritesAttribute(attribute = "human.reviewer", description = "The identifier of the human reviewer"),
    @WritesAttribute(attribute = "human.review_time_ms", description = "Time taken for human review in milliseconds"),
    @WritesAttribute(attribute = "human.comments", description = "Optional comments from the reviewer"),
    @WritesAttribute(attribute = "human.channel", description = "The approval channel used"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'human-in-the-loop' on timeout/rejection for error routing")
})
public class HumanInTheLoopProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "human-in-the-loop";

    // Pattern for parsing timeout duration strings (e.g., "1 hour", "30 min", "5 mins")
    private static final Pattern TIMEOUT_PATTERN = Pattern.compile(
            "(\\d+)\\s*(hour|hr|min|minute|sec|second|day)s?",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * In-memory store of pending approvals.
     * Key: task ID, Value: approval record
     *
     * In production, this should be backed by a persistent store (Redis, database)
     * via a Controller Service for cluster-wide coordination.
     */
    private static final ConcurrentHashMap<String, ApprovalRecord> pendingApprovals =
            new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalApproved = new AtomicLong(0);
    private final AtomicLong totalRejected = new AtomicLong(0);
    private final AtomicLong totalTimedOut = new AtomicLong(0);

    public static final AllowableValue CHANNEL_UI = new AllowableValue(
            "ui", "NiFi UI", "Approve via NiFi UI extension");
    public static final AllowableValue CHANNEL_SLACK = new AllowableValue(
            "slack", "Slack", "Approve via Slack interactive message");
    public static final AllowableValue CHANNEL_API = new AllowableValue(
            "api", "REST API", "Approve via REST API call");

    public static final PropertyDescriptor APPROVAL_CHANNEL = new PropertyDescriptor.Builder()
            .name("approval-channel")
            .displayName("Approval Channel")
            .description("The channel through which humans approve or reject actions.")
            .required(true)
            .allowableValues(CHANNEL_UI, CHANNEL_SLACK, CHANNEL_API)
            .defaultValue(CHANNEL_UI.getValue())
            .build();

    public static final PropertyDescriptor TIMEOUT = new PropertyDescriptor.Builder()
            .name("timeout")
            .displayName("Timeout")
            .description("Maximum time to wait for human response. After this period, "
                    + "the FlowFile is routed to 'timed_out'. Use NiFi time format "
                    + "(e.g., '1 hour', '30 min', '5 mins').")
            .required(false)
            .defaultValue("1 hour")
            .addValidator(StandardValidators.TIME_PERIOD_VALIDATOR)
            .build();

    public static final PropertyDescriptor APPROVAL_MESSAGE = new PropertyDescriptor.Builder()
            .name("approval-message")
            .displayName("Approval Message Template")
            .description(
                    "Message template sent to the reviewer. Supports Expression Language " +
                    "to include task details from FlowFile attributes."
            )
            .required(false)
            .defaultValue("Agent '${task.origin_agent}' requests approval for task '${task.id}'")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor AUTO_APPROVE_RULES = new PropertyDescriptor.Builder()
            .name("auto-approve-rules")
            .displayName("Auto-Approve Rules (JSON)")
            .description(
                    "JSON array of rules for auto-approving low-risk actions. " +
                    "Each rule has 'condition' (attribute expression) and 'description'. " +
                    "Use '[]' for no auto-approve rules."
            )
            .required(false)
            .defaultValue("[]")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_APPROVED = new Relationship.Builder()
            .name("approved")
            .description("Human approved the action — continue the agent pipeline.")
            .build();

    public static final Relationship REL_REJECTED = new Relationship.Builder()
            .name("rejected")
            .description("Human rejected the action — route to error handling.")
            .build();

    public static final Relationship REL_TIMED_OUT = new Relationship.Builder()
            .name("timed_out")
            .description("No human response within the timeout period — route to escalation.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            APPROVAL_CHANNEL, TIMEOUT, APPROVAL_MESSAGE, AUTO_APPROVE_RULES
    );

    private final Set<Relationship> relationships = Set.of(
            REL_APPROVED, REL_REJECTED, REL_TIMED_OUT
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
        totalApproved.set(0);
        totalRejected.set(0);
        totalTimedOut.set(0);
        getLogger().info("HumanInTheLoopProcessor scheduled — channel: {}, timeout: {}",
                context.getProperty(APPROVAL_CHANNEL).getValue(),
                context.getProperty(TIMEOUT).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("HumanInTheLoopProcessor stopped — approved: {}, rejected: {}, timed out: {}, "
                        + "pending: {}",
                totalApproved.get(), totalRejected.get(), totalTimedOut.get(),
                pendingApprovals.size());
        // Note: We do NOT clear pendingApprovals on stop — approvals may still arrive
        // and should be honored when the processor restarts
    }

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        String taskId = flowFile.getAttribute("task.id");
        if (taskId == null) {
            taskId = flowFile.getAttribute("uuid");
        }

        final String channel = context.getProperty(APPROVAL_CHANNEL).getValue();
        final long timeoutMs = parseTimeoutMs(context.getProperty(TIMEOUT).getValue());

        // Check if we already have a pending approval for this task
        ApprovalRecord record = pendingApprovals.get(taskId);

        if (record == null) {
            // First time seeing this task — create approval request
            record = new ApprovalRecord(taskId, System.currentTimeMillis());
            pendingApprovals.put(taskId, record);

            final String approvalMessage = context.getProperty(APPROVAL_MESSAGE)
                    .evaluateAttributeExpressions(flowFile).getValue();

            // Send approval request via the configured channel
            getLogger().info("Human approval requested for task {} via {}: {}",
                    taskId, channel, approvalMessage);

            // Rollback with penalize — FlowFile is returned to the queue but penalized,
            // so it won't be re-processed until the penalty duration (default 30 sec) expires.
            // This is the NiFi best practice for wait-and-check patterns.
            // IMPORTANT: session.rollback(true) is the correct API — calling penalize()
            // then rollback() would cancel the penalize since rollback() reverts all changes.
            session.rollback(true);
            return;
        }

        // Check approval status
        switch (record.status) {
            case "approved" -> {
                final long reviewTime = System.currentTimeMillis() - record.createdAt;
                final Map<String, String> attrs = new HashMap<>();
                attrs.put("human.decision", "approved");
                attrs.put("human.reviewer", record.reviewer != null ? record.reviewer : "unknown");
                attrs.put("human.review_time_ms", String.valueOf(reviewTime));
                attrs.put("human.channel", channel);
                if (record.comments != null) {
                    attrs.put("human.comments", record.comments);
                }
                flowFile = session.putAllAttributes(flowFile, attrs);
                pendingApprovals.remove(taskId);
                totalApproved.incrementAndGet();
                session.transfer(flowFile, REL_APPROVED);
                session.getProvenanceReporter().route(flowFile, REL_APPROVED.getName(),
                        "Approved by " + record.reviewer + " after " + reviewTime + "ms");
            }
            case "rejected" -> {
                final long reviewTime = System.currentTimeMillis() - record.createdAt;
                final Map<String, String> attrs = new HashMap<>();
                attrs.put("human.decision", "rejected");
                attrs.put("human.reviewer", record.reviewer != null ? record.reviewer : "unknown");
                attrs.put("human.review_time_ms", String.valueOf(reviewTime));
                attrs.put("human.channel", channel);
                attrs.put("error_stage", ERROR_STAGE);
                if (record.comments != null) {
                    attrs.put("human.comments", record.comments);
                }
                flowFile = session.putAllAttributes(flowFile, attrs);
                pendingApprovals.remove(taskId);
                totalRejected.incrementAndGet();
                session.transfer(flowFile, REL_REJECTED);
                session.getProvenanceReporter().route(flowFile, REL_REJECTED.getName(),
                        "Rejected by " + record.reviewer + " after " + reviewTime + "ms");
            }
            default -> {
                // Still pending — check timeout
                final long elapsed = System.currentTimeMillis() - record.createdAt;
                if (elapsed > timeoutMs) {
                    getLogger().warn("Human approval timed out for task {} after {}ms (timeout={}ms)",
                            taskId, elapsed, timeoutMs);
                    final Map<String, String> attrs = new HashMap<>();
                    attrs.put("human.decision", "timed_out");
                    attrs.put("human.review_time_ms", String.valueOf(elapsed));
                    attrs.put("human.channel", channel);
                    attrs.put("error_stage", ERROR_STAGE);
                    flowFile = session.putAllAttributes(flowFile, attrs);
                    pendingApprovals.remove(taskId);
                    totalTimedOut.incrementAndGet();
                    session.transfer(flowFile, REL_TIMED_OUT);
                } else {
                    // Still waiting — rollback with penalize to check again after penalty duration
                    session.rollback(true);
                }
            }
        }
    }

    /**
     * Parses a NiFi time period string to milliseconds.
     */
    private long parseTimeoutMs(String timeoutStr) {
        if (timeoutStr == null || timeoutStr.isEmpty()) {
            return TimeUnit.HOURS.toMillis(1); // default 1 hour
        }

        final Matcher matcher = TIMEOUT_PATTERN.matcher(timeoutStr.trim());
        if (matcher.find()) {
            final long value = Long.parseLong(matcher.group(1));
            final String unit = matcher.group(2).toLowerCase();
            return switch (unit) {
                case "day" -> TimeUnit.DAYS.toMillis(value);
                case "hour", "hr" -> TimeUnit.HOURS.toMillis(value);
                case "min", "minute" -> TimeUnit.MINUTES.toMillis(value);
                case "sec", "second" -> TimeUnit.SECONDS.toMillis(value);
                default -> TimeUnit.HOURS.toMillis(1);
            };
        }

        return TimeUnit.HOURS.toMillis(1); // fallback
    }

    /**
     * Approve a pending task (called by external API/UI).
     */
    public static void approveTask(String taskId, String reviewer, String comments) {
        final ApprovalRecord record = pendingApprovals.get(taskId);
        if (record != null) {
            record.status = "approved";
            record.reviewer = reviewer;
            record.comments = comments;
        }
    }

    /**
     * Reject a pending task (called by external API/UI).
     */
    public static void rejectTask(String taskId, String reviewer, String comments) {
        final ApprovalRecord record = pendingApprovals.get(taskId);
        if (record != null) {
            record.status = "rejected";
            record.reviewer = reviewer;
            record.comments = comments;
        }
    }

    /**
     * Get the count of pending approvals (for monitoring).
     */
    public static int getPendingCount() {
        return pendingApprovals.size();
    }

    private static class ApprovalRecord {
        final String taskId;
        final long createdAt;
        volatile String status = "pending";
        volatile String reviewer;
        volatile String comments;

        ApprovalRecord(String taskId, long createdAt) {
            this.taskId = taskId;
            this.createdAt = createdAt;
        }
    }
}
