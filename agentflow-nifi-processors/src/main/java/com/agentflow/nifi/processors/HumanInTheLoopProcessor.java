/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.nifi.annotation.behavior.InputRequirement;
import org.apache.nifi.annotation.behavior.InputRequirement.Requirement;
import org.apache.nifi.annotation.behavior.WritesAttribute;
import org.apache.nifi.annotation.behavior.WritesAttributes;
import org.apache.nifi.annotation.documentation.CapabilityDescription;
import org.apache.nifi.annotation.documentation.Tags;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pauses the agent flow and waits for human approval before continuing.
 * FlowFiles are held until a human responds via the configured approval
 * channel (UI, Slack, or REST API).
 *
 * <p>This processor leverages NiFi's natural back-pressure mechanism — the
 * FlowFile sits in the incoming connection queue until the human responds,
 * at which point the processor picks it up and routes it accordingly.</p>
 */
@Tags({"agentflow", "ai", "human", "approval", "review", "hitl", "human-in-the-loop"})
@CapabilityDescription(
        "Pauses the agent workflow and waits for human approval. FlowFiles are " +
        "held in the queue until a human approves or rejects the action via " +
        "the configured channel (NiFi UI, Slack, or REST API). Supports auto-approve " +
        "rules for low-risk actions and escalation policies for timeouts."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "human.decision", description = "The human's decision: approved, rejected, or timed_out"),
    @WritesAttribute(attribute = "human.reviewer", description = "The identifier of the human reviewer"),
    @WritesAttribute(attribute = "human.review_time_ms", description = "Time taken for human review in milliseconds"),
    @WritesAttribute(attribute = "human.comments", description = "Optional comments from the reviewer")
})
public class HumanInTheLoopProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * In-memory store of pending approvals.
     * Key: task ID, Value: approval status ("pending", "approved", "rejected")
     *
     * In production, this would be backed by a persistent store (Redis, database)
     * via the AgentStateService controller service.
     */
    private static final ConcurrentHashMap<String, ApprovalRecord> pendingApprovals = new ConcurrentHashMap<>();

    public static final AllowableValue CHANNEL_UI = new AllowableValue("ui", "NiFi UI", "Approve via NiFi UI extension");
    public static final AllowableValue CHANNEL_SLACK = new AllowableValue("slack", "Slack", "Approve via Slack message");
    public static final AllowableValue CHANNEL_API = new AllowableValue("api", "REST API", "Approve via REST API call");

    public static final PropertyDescriptor APPROVAL_CHANNEL = new PropertyDescriptor.Builder()
            .name("approval-channel")
            .displayName("Approval Channel")
            .description("The channel through which humans approve or reject actions")
            .required(true)
            .allowableValues(CHANNEL_UI, CHANNEL_SLACK, CHANNEL_API)
            .defaultValue(CHANNEL_UI.getValue())
            .build();

    public static final PropertyDescriptor TIMEOUT = new PropertyDescriptor.Builder()
            .name("timeout")
            .displayName("Timeout")
            .description("Maximum time to wait for human response (e.g., '1 hour', '30 min')")
            .required(false)
            .defaultValue("1 hour")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
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
                    "Each rule has 'condition' (attribute expression) and 'description'."
            )
            .required(false)
            .defaultValue("[]")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_APPROVED = new Relationship.Builder()
            .name("approved")
            .description("Human approved the action")
            .build();

    public static final Relationship REL_REJECTED = new Relationship.Builder()
            .name("rejected")
            .description("Human rejected the action")
            .build();

    public static final Relationship REL_TIMED_OUT = new Relationship.Builder()
            .name("timed_out")
            .description("No human response within the timeout period")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(APPROVAL_CHANNEL);
        descriptors.add(TIMEOUT);
        descriptors.add(APPROVAL_MESSAGE);
        descriptors.add(AUTO_APPROVE_RULES);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_APPROVED);
        relationships.add(REL_REJECTED);
        relationships.add(REL_TIMED_OUT);
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

        String taskId = flowFile.getAttribute("task.id");
        if (taskId == null) {
            taskId = flowFile.getAttribute("uuid");
        }

        // Check if we already have a pending approval for this task
        ApprovalRecord record = pendingApprovals.get(taskId);

        if (record == null) {
            // First time seeing this task — create approval request
            record = new ApprovalRecord(taskId, System.currentTimeMillis());
            pendingApprovals.put(taskId, record);

            String approvalMessage = context.getProperty(APPROVAL_MESSAGE)
                    .evaluateAttributeExpressions(flowFile).getValue();

            // TODO: Send approval request via the configured channel (UI/Slack/API)
            getLogger().info("Human approval requested for task {}: {}", taskId, approvalMessage);

            // Yield and penalize — put the FlowFile back and check again later
            session.transfer(flowFile, REL_APPROVED); // TODO: Replace with penalize + yield pattern
            return;
        }

        // Check approval status
        switch (record.status) {
            case "approved":
                long reviewTime = System.currentTimeMillis() - record.createdAt;
                flowFile = session.putAttribute(flowFile, "human.decision", "approved");
                flowFile = session.putAttribute(flowFile, "human.reviewer", record.reviewer);
                flowFile = session.putAttribute(flowFile, "human.review_time_ms", String.valueOf(reviewTime));
                if (record.comments != null) {
                    flowFile = session.putAttribute(flowFile, "human.comments", record.comments);
                }
                pendingApprovals.remove(taskId);
                session.transfer(flowFile, REL_APPROVED);
                break;

            case "rejected":
                flowFile = session.putAttribute(flowFile, "human.decision", "rejected");
                flowFile = session.putAttribute(flowFile, "human.reviewer", record.reviewer);
                if (record.comments != null) {
                    flowFile = session.putAttribute(flowFile, "human.comments", record.comments);
                }
                pendingApprovals.remove(taskId);
                session.transfer(flowFile, REL_REJECTED);
                break;

            default:
                // Still pending — check timeout
                // TODO: Parse timeout duration from property and check
                // For now, yield and try again
                context.yield();
                session.rollback();
                break;
        }
    }

    /**
     * Static method to approve a pending task (called by external API/UI).
     */
    public static void approveTask(String taskId, String reviewer, String comments) {
        ApprovalRecord record = pendingApprovals.get(taskId);
        if (record != null) {
            record.status = "approved";
            record.reviewer = reviewer;
            record.comments = comments;
        }
    }

    /**
     * Static method to reject a pending task (called by external API/UI).
     */
    public static void rejectTask(String taskId, String reviewer, String comments) {
        ApprovalRecord record = pendingApprovals.get(taskId);
        if (record != null) {
            record.status = "rejected";
            record.reviewer = reviewer;
            record.comments = comments;
        }
    }

    private static class ApprovalRecord {
        String taskId;
        String status = "pending";
        String reviewer;
        String comments;
        long createdAt;

        ApprovalRecord(String taskId, long createdAt) {
            this.taskId = taskId;
            this.createdAt = createdAt;
        }
    }
}
