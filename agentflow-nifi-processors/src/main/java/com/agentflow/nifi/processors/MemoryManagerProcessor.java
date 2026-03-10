/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.processors;

import com.agentflow.nifi.services.VectorDBService;
import com.fasterxml.jackson.core.type.TypeReference;
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

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Manages agent memory by reading from and writing to a vector database.
 * Supports both retrieval (RAG-style context enrichment) and storage
 * (persisting agent outputs for future reference).
 */
@Tags({"agentflow", "ai", "memory", "rag", "vector", "retrieval", "embedding"})
@CapabilityDescription(
        "Manages agent long-term memory via a vector database. In 'read' mode, " +
        "performs similarity search to retrieve relevant context for the current task. " +
        "In 'write' mode, stores the agent's output for future retrieval. Supports " +
        "agent-scoped and global memory collections."
)
@InputRequirement(Requirement.INPUT_REQUIRED)
@WritesAttributes({
    @WritesAttribute(attribute = "memory.results", description = "JSON array of retrieved memory entries"),
    @WritesAttribute(attribute = "memory.result_count", description = "Number of memory entries retrieved"),
    @WritesAttribute(attribute = "memory.operation_type", description = "The operation performed: read or write")
})
public class MemoryManagerProcessor extends AbstractProcessor {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final AllowableValue OP_READ = new AllowableValue("read", "Read", "Retrieve relevant memories");
    public static final AllowableValue OP_WRITE = new AllowableValue("write", "Write", "Store new memory entry");

    public static final AllowableValue SCOPE_AGENT = new AllowableValue("agent", "Agent", "Agent-specific memory collection");
    public static final AllowableValue SCOPE_GLOBAL = new AllowableValue("global", "Global", "Shared global memory collection");

    public static final PropertyDescriptor VECTORDB_SERVICE = new PropertyDescriptor.Builder()
            .name("vectordb-service")
            .displayName("Vector DB Service")
            .description("The controller service providing vector database connectivity")
            .required(true)
            .identifiesControllerService(VectorDBService.class)
            .build();

    public static final PropertyDescriptor OPERATION = new PropertyDescriptor.Builder()
            .name("operation")
            .displayName("Operation")
            .description("Whether to read (retrieve) or write (store) memory")
            .required(true)
            .allowableValues(OP_READ, OP_WRITE)
            .defaultValue(OP_READ.getValue())
            .build();

    public static final PropertyDescriptor COLLECTION_NAME = new PropertyDescriptor.Builder()
            .name("collection-name")
            .displayName("Collection Name")
            .description("The vector database collection/index name")
            .required(false)
            .defaultValue("agent_memory")
            .expressionLanguageSupported(ExpressionLanguageScope.FLOWFILE_ATTRIBUTES)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor MEMORY_SCOPE = new PropertyDescriptor.Builder()
            .name("memory-scope")
            .displayName("Memory Scope")
            .description("Whether this memory is agent-specific or shared globally")
            .required(false)
            .allowableValues(SCOPE_AGENT, SCOPE_GLOBAL)
            .defaultValue(SCOPE_AGENT.getValue())
            .build();

    public static final PropertyDescriptor TOP_K = new PropertyDescriptor.Builder()
            .name("top-k")
            .displayName("Top-K Results")
            .description("Maximum number of similar memories to retrieve (read mode only)")
            .required(false)
            .defaultValue("5")
            .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
            .build();

    public static final PropertyDescriptor SIMILARITY_THRESHOLD = new PropertyDescriptor.Builder()
            .name("similarity-threshold")
            .displayName("Similarity Threshold")
            .description("Minimum similarity score for retrieved results (0.0 - 1.0)")
            .required(false)
            .defaultValue("0.7")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final Relationship REL_SUCCESS = new Relationship.Builder()
            .name("success")
            .description("Memory operation completed successfully")
            .build();

    public static final Relationship REL_FAILURE = new Relationship.Builder()
            .name("failure")
            .description("Memory operation failed")
            .build();

    private List<PropertyDescriptor> descriptors;
    private Set<Relationship> relationships;

    @Override
    protected void init(final org.apache.nifi.processor.ProcessorInitializationContext context) {
        final List<PropertyDescriptor> descriptors = new ArrayList<>();
        descriptors.add(VECTORDB_SERVICE);
        descriptors.add(OPERATION);
        descriptors.add(COLLECTION_NAME);
        descriptors.add(MEMORY_SCOPE);
        descriptors.add(TOP_K);
        descriptors.add(SIMILARITY_THRESHOLD);
        this.descriptors = Collections.unmodifiableList(descriptors);

        final Set<Relationship> relationships = new HashSet<>();
        relationships.add(REL_SUCCESS);
        relationships.add(REL_FAILURE);
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

        final VectorDBService vectorDB = context.getProperty(VECTORDB_SERVICE)
                .asControllerService(VectorDBService.class);
        final String operation = context.getProperty(OPERATION).getValue();
        final String collection = context.getProperty(COLLECTION_NAME)
                .evaluateAttributeExpressions(flowFile).getValue();

        try {
            if ("read".equals(operation)) {
                handleRead(context, session, flowFile, vectorDB, collection);
            } else {
                handleWrite(session, flowFile, vectorDB, collection);
            }
        } catch (Exception e) {
            getLogger().error("Memory operation '{}' failed", operation, e);
            flowFile = session.putAttribute(flowFile, "memory.error", e.getMessage());
            session.transfer(flowFile, REL_FAILURE);
        }
    }

    private void handleRead(ProcessContext context, ProcessSession session, FlowFile flowFile,
                            VectorDBService vectorDB, String collection)
            throws VectorDBService.VectorDBException {

        int topK = context.getProperty(TOP_K).asInteger();
        double threshold = Double.parseDouble(context.getProperty(SIMILARITY_THRESHOLD).getValue());

        // Read the query text from FlowFile content
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        String queryText = baos.toString(StandardCharsets.UTF_8);

        // Perform similarity search
        List<Map<String, Object>> results = vectorDB.search(collection, queryText, topK, threshold);

        try {
            String resultsJson = objectMapper.writeValueAsString(results);
            flowFile = session.putAttribute(flowFile, "memory.results", resultsJson);
            flowFile = session.putAttribute(flowFile, "memory.result_count", String.valueOf(results.size()));
            flowFile = session.putAttribute(flowFile, "memory.operation_type", "read");
        } catch (Exception e) {
            getLogger().warn("Failed to serialize memory results", e);
        }

        session.transfer(flowFile, REL_SUCCESS);
    }

    private void handleWrite(ProcessSession session, FlowFile flowFile,
                             VectorDBService vectorDB, String collection)
            throws VectorDBService.VectorDBException {

        // Read content to store from FlowFile
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        session.exportTo(flowFile, baos);
        String content = baos.toString(StandardCharsets.UTF_8);

        String docId = flowFile.getAttribute("task.id");
        if (docId == null) {
            docId = UUID.randomUUID().toString();
        }

        Map<String, String> metadata = new HashMap<>();
        metadata.put("agent.name", flowFile.getAttribute("task.origin_agent"));
        metadata.put("task.id", flowFile.getAttribute("task.id"));
        metadata.put("timestamp", String.valueOf(System.currentTimeMillis()));

        vectorDB.store(collection, docId, content, metadata);

        flowFile = session.putAttribute(flowFile, "memory.operation_type", "write");
        session.transfer(flowFile, REL_SUCCESS);
    }
}
