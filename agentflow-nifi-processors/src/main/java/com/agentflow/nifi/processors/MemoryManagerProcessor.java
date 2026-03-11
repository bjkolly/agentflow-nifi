/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.VectorDBService;
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

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Manages agent memory by reading from and writing to a vector database.
 * Supports both retrieval (RAG-style context enrichment) and storage
 * (persisting agent outputs for future reference).
 *
 * <h3>Best Practices (from Foundatation Configuration)</h3>
 * <ul>
 *   <li>Schedule at 0 sec (event-driven) for minimum latency</li>
 *   <li>Penalty duration: 30 sec, Yield duration: 1 sec</li>
 *   <li>This is I/O-bound (vector DB calls) — run duration should be 0ms</li>
 *   <li>Configure retry count of 10 with YIELD_PROCESSOR backoff (2 min max)
 *       on the 'failure' relationship</li>
 *   <li>Define the VectorDBService Controller Service at root Process Group
 *       level for shared access across all agent Process Groups</li>
 *   <li>Use Expression Language on Collection Name to scope memory per agent
 *       (e.g., ${task.origin_agent}_memory)</li>
 *   <li>Place 'read' mode instances before the LLMInferenceProcessor for RAG</li>
 *   <li>Place 'write' mode instances after successful agent output</li>
 * </ul>
 */
@Tags({"agentflow", "ai", "memory", "rag", "vector", "retrieval", "embedding", "foundatation"})
@CapabilityDescription(
        "Manages agent long-term memory via a vector database. In 'read' mode, " +
        "performs similarity search to retrieve relevant context for the current task. " +
        "In 'write' mode, stores the agent's output for future retrieval. Supports " +
        "agent-scoped and global memory collections. " +
        "Recommended: penalty 30 sec, yield 1 sec, retry 10 with YIELD_PROCESSOR on failure."
)
@SeeAlso({LLMInferenceProcessor.class, TaskPlannerProcessor.class})
@EventDriven
@SupportsBatching
@InputRequirement(Requirement.INPUT_REQUIRED)
@ReadsAttributes({
    @ReadsAttribute(attribute = "task.id", description = "The unique task identifier, used as document ID for writes"),
    @ReadsAttribute(attribute = "task.origin_agent", description = "The originating agent, used for scoped collections")
})
@WritesAttributes({
    @WritesAttribute(attribute = "memory.results", description = "JSON array of retrieved memory entries (read mode)"),
    @WritesAttribute(attribute = "memory.result_count", description = "Number of memory entries retrieved"),
    @WritesAttribute(attribute = "memory.operation_type", description = "The operation performed: read or write"),
    @WritesAttribute(attribute = "memory.collection", description = "The vector DB collection used"),
    @WritesAttribute(attribute = "memory.latency_ms", description = "Vector DB operation latency in milliseconds"),
    @WritesAttribute(attribute = "memory.error", description = "Error message if the operation failed"),
    @WritesAttribute(attribute = "error_stage", description = "Set to 'memory-manager' on failure for error routing")
})
public class MemoryManagerProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ERROR_STAGE = "memory-manager";

    // Metrics
    private final AtomicLong totalReads = new AtomicLong(0);
    private final AtomicLong totalWrites = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);

    public static final AllowableValue OP_READ = new AllowableValue(
            "read", "Read", "Retrieve relevant memories via similarity search (RAG)");
    public static final AllowableValue OP_WRITE = new AllowableValue(
            "write", "Write", "Store new memory entry in the vector database");

    public static final AllowableValue SCOPE_AGENT = new AllowableValue(
            "agent", "Agent", "Agent-specific memory collection — isolated per agent");
    public static final AllowableValue SCOPE_GLOBAL = new AllowableValue(
            "global", "Global", "Shared global memory collection — accessible by all agents");

    public static final PropertyDescriptor VECTORDB_SERVICE = new PropertyDescriptor.Builder()
            .name("vectordb-service")
            .displayName("Vector DB Service")
            .description("The controller service providing vector database connectivity. "
                    + "Define at root Process Group level for shared access across agents.")
            .required(true)
            .identifiesControllerService(VectorDBService.class)
            .build();

    public static final PropertyDescriptor OPERATION = new PropertyDescriptor.Builder()
            .name("operation")
            .displayName("Operation")
            .description("Whether to read (retrieve via similarity search) or write (store) memory. "
                    + "Use separate processor instances for read and write in the flow.")
            .required(true)
            .allowableValues(OP_READ, OP_WRITE)
            .defaultValue(OP_READ.getValue())
            .build();

    public static final PropertyDescriptor COLLECTION_NAME = new PropertyDescriptor.Builder()
            .name("collection-name")
            .displayName("Collection Name")
            .description("The vector database collection/index name. Supports Expression Language "
                    + "for dynamic scoping (e.g., ${task.origin_agent}_memory).")
            .required(false)
            .defaultValue("agent_memory")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MEMORY_SCOPE = new PropertyDescriptor.Builder()
            .name("memory-scope")
            .displayName("Memory Scope")
            .description("Whether this memory is agent-specific or shared globally. "
                    + "Agent scope automatically prefixes the collection name with the agent name.")
            .required(false)
            .allowableValues(SCOPE_AGENT, SCOPE_GLOBAL)
            .defaultValue(SCOPE_AGENT.getValue())
            .build();

    public static final PropertyDescriptor TOP_K = new PropertyDescriptor.Builder()
            .name("top-k")
            .displayName("Top-K Results")
            .description("Maximum number of similar memories to retrieve (read mode only). "
                    + "Higher values provide more context but increase token usage in the LLM call.")
            .required(false)
            .defaultValue("5")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor SIMILARITY_THRESHOLD = new PropertyDescriptor.Builder()
            .name("similarity-threshold")
            .displayName("Similarity Threshold")
            .description("Minimum similarity score for retrieved results (0.0 - 1.0). "
                    + "Higher values return fewer but more relevant results.")
            .required(false)
            .defaultValue("0.7")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("Memory operation completed successfully.")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Memory operation failed. Configure retry count 10, YIELD_PROCESSOR, max 2 mins.")
            .build();

    private final List<PropertyDescriptor> descriptors = List.of(
            VECTORDB_SERVICE, OPERATION, COLLECTION_NAME, MEMORY_SCOPE,
            TOP_K, SIMILARITY_THRESHOLD
    );

    private final Set<Relationship> relationships = Set.of(REL_SUCCESS, REL_FAILURE);

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
        totalReads.set(0);
        totalWrites.set(0);
        totalErrors.set(0);
        getLogger().info("MemoryManagerProcessor scheduled — operation: {}, collection: {}, scope: {}",
                context.getProperty(OPERATION).getValue(),
                context.getProperty(COLLECTION_NAME).getValue(),
                context.getProperty(MEMORY_SCOPE).getValue());
    }

    @OnStopped
    public void onStopped() {
        getLogger().info("MemoryManagerProcessor stopped — reads: {}, writes: {}, errors: {}",
                totalReads.get(), totalWrites.get(), totalErrors.get());
    }

    @Override
    public void onTrigger(final ProcessContext context, final ProcessSession session) throws ProcessException {
        FlowFile flowFile = session.get();
        if (flowFile == null) {
            return;
        }

        final VectorDBService vectorDB = context.getProperty(VECTORDB_SERVICE)
                .asControllerService(VectorDBService.class);
        final String operation = context.getProperty(OPERATION).getValue();

        // Resolve collection name with optional agent-scoping
        String collection = context.getProperty(COLLECTION_NAME)
                .evaluateAttributeExpressions(flowFile).getValue();
        final String scope = context.getProperty(MEMORY_SCOPE).getValue();
        if ("agent".equals(scope)) {
            final String agentName = flowFile.getAttribute("task.origin_agent");
            if (agentName != null && !agentName.isEmpty()) {
                collection = agentName + "_" + collection;
            }
        }

        final long startTime = System.currentTimeMillis();

        try {
            if ("read".equals(operation)) {
                handleRead(context, session, flowFile, vectorDB, collection, startTime);
            } else {
                handleWrite(session, flowFile, vectorDB, collection, startTime);
            }
        } catch (Exception e) {
            final long latencyMs = System.currentTimeMillis() - startTime;
            totalErrors.incrementAndGet();
            getLogger().error("Memory operation '{}' failed for task {} after {}ms",
                    operation, flowFile.getAttribute("task.id"), latencyMs, e);
            flowFile = session.putAttribute(flowFile, "memory.error",
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            flowFile = session.putAttribute(flowFile, "memory.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private void handleRead(ProcessContext context, ProcessSession session, FlowFile flowFile,
                            VectorDBService vectorDB, String collection, long startTime)
            throws VectorDBService.VectorDBException {

        final int topK = Integer.parseInt(context.getProperty(TOP_K)
                .evaluateAttributeExpressions(flowFile).getValue());
        final double threshold = Double.parseDouble(context.getProperty(SIMILARITY_THRESHOLD)
                .evaluateAttributeExpressions(flowFile).getValue());

        // Read the query text from FlowFile content
        final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        final String queryText = baos.toString(StandardCharsets.UTF_8);

        // Perform similarity search
        final List<Map<String, Object>> results = vectorDB.search(collection, queryText, topK, threshold);

        final long latencyMs = System.currentTimeMillis() - startTime;
        totalReads.incrementAndGet();

        final String resultsJson;
        try {
            resultsJson = objectMapper.writeValueAsString(results);
        } catch (Exception e) {
            // If we can't serialize the results, this is a real failure — don't swallow it.
            // The downstream processor would receive a FlowFile with no results attributes.
            totalErrors.incrementAndGet();
            getLogger().error("Failed to serialize memory results for task {} — {} results lost",
                    flowFile.getAttribute("task.id"), results.size(), e);
            flowFile = session.putAttribute(flowFile, "memory.error",
                    "Failed to serialize results: " + e.getMessage());
            flowFile = session.putAttribute(flowFile, "memory.latency_ms", String.valueOf(latencyMs));
            flowFile = session.putAttribute(flowFile, "error_stage", ERROR_STAGE);
            session.transfer(flowFile, REL_FAILURE);
            return;
        }

        final Map<String, String> attrs = new HashMap<>();
        attrs.put("memory.results", resultsJson);
        attrs.put("memory.result_count", String.valueOf(results.size()));
        attrs.put("memory.operation_type", "read");
        attrs.put("memory.collection", collection);
        attrs.put("memory.latency_ms", String.valueOf(latencyMs));
        flowFile = session.putAllAttributes(flowFile, attrs);

        session.transfer(flowFile, REL_SUCCESS);
        session.getProvenanceReporter().route(flowFile, REL_SUCCESS.getName(),
                "Retrieved " + results.size() + " memories from " + collection
                        + " in " + latencyMs + "ms");
    }

    private void handleWrite(ProcessSession session, FlowFile flowFile,
                             VectorDBService vectorDB, String collection, long startTime)
            throws VectorDBService.VectorDBException {

        // Read content to store from FlowFile
        final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        final String content = baos.toString(StandardCharsets.UTF_8);

        String docId = flowFile.getAttribute("task.id");
        if (docId == null) {
            docId = UUID.randomUUID().toString();
        }

        final Map<String, String> metadata = new HashMap<>();
        metadata.put("agent.name", flowFile.getAttribute("task.origin_agent"));
        metadata.put("task.id", flowFile.getAttribute("task.id"));
        metadata.put("timestamp", String.valueOf(System.currentTimeMillis()));

        vectorDB.store(collection, docId, content, metadata);

        final long latencyMs = System.currentTimeMillis() - startTime;
        totalWrites.incrementAndGet();

        final Map<String, String> attrs = new HashMap<>();
        attrs.put("memory.operation_type", "write");
        attrs.put("memory.collection", collection);
        attrs.put("memory.latency_ms", String.valueOf(latencyMs));
        flowFile = session.putAllAttributes(flowFile, attrs);

        session.transfer(flowFile, REL_SUCCESS);
        session.getProvenanceReporter().route(flowFile, REL_SUCCESS.getName(),
                "Stored memory in " + collection + " in " + latencyMs + "ms");
    }
}
