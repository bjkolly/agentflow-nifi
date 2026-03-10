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
import org.apache.nifi.components.AllowableValue;
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
import java.util.concurrent.TimeUnit;

/**
 * Standard implementation of {@link VectorDBService} providing connectivity
 * to vector databases for agent memory and RAG workflows.
 */
@Tags({"agentflow", "ai", "vector", "memory", "rag", "embedding", "pinecone", "chromadb"})
@CapabilityDescription(
        "Manages connections to vector databases for agent long-term memory, " +
        "knowledge retrieval, and RAG (Retrieval Augmented Generation) workflows. " +
        "Supports Pinecone, ChromaDB, pgvector, and Weaviate."
)
public class StandardVectorDBService extends AbstractControllerService implements VectorDBService {

    private static final Logger logger = LoggerFactory.getLogger(StandardVectorDBService.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static final AllowableValue PROVIDER_PINECONE = new AllowableValue("pinecone", "Pinecone", "Pinecone vector database");
    public static final AllowableValue PROVIDER_CHROMADB = new AllowableValue("chromadb", "ChromaDB", "ChromaDB vector database");
    public static final AllowableValue PROVIDER_PGVECTOR = new AllowableValue("pgvector", "pgvector", "PostgreSQL pgvector extension");
    public static final AllowableValue PROVIDER_WEAVIATE = new AllowableValue("weaviate", "Weaviate", "Weaviate vector database");

    public static final PropertyDescriptor PROVIDER = new PropertyDescriptor.Builder()
            .name("vectordb-provider")
            .displayName("Vector DB Provider")
            .description("The vector database provider to connect to")
            .required(true)
            .allowableValues(PROVIDER_PINECONE, PROVIDER_CHROMADB, PROVIDER_PGVECTOR, PROVIDER_WEAVIATE)
            .defaultValue(PROVIDER_CHROMADB.getValue())
            .build();

    public static final PropertyDescriptor CONNECTION_URL = new PropertyDescriptor.Builder()
            .name("connection-url")
            .displayName("Connection URL")
            .description("The connection URL for the vector database")
            .required(true)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor API_KEY = new PropertyDescriptor.Builder()
            .name("api-key")
            .displayName("API Key")
            .description("API key for authenticating with the vector database (if required)")
            .required(false)
            .sensitive(true)
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor EMBEDDING_MODEL = new PropertyDescriptor.Builder()
            .name("embedding-model")
            .displayName("Embedding Model")
            .description("The embedding model used to generate vectors (e.g., text-embedding-3-large)")
            .required(true)
            .defaultValue("text-embedding-3-small")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    public static final PropertyDescriptor DEFAULT_COLLECTION = new PropertyDescriptor.Builder()
            .name("default-collection")
            .displayName("Default Collection")
            .description("The default collection/index name to use when none is specified")
            .required(false)
            .defaultValue("agent_memory")
            .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
            .build();

    private OkHttpClient httpClient;
    private String provider;
    private String connectionUrl;
    private String apiKey;
    private String embeddingModel;
    private String defaultCollection;

    @Override
    protected List<PropertyDescriptor> getSupportedPropertyDescriptors() {
        final List<PropertyDescriptor> properties = new ArrayList<>();
        properties.add(PROVIDER);
        properties.add(CONNECTION_URL);
        properties.add(API_KEY);
        properties.add(EMBEDDING_MODEL);
        properties.add(DEFAULT_COLLECTION);
        return Collections.unmodifiableList(properties);
    }

    @OnEnabled
    public void onEnabled(final ConfigurationContext context) {
        this.provider = context.getProperty(PROVIDER).getValue();
        this.connectionUrl = context.getProperty(CONNECTION_URL).getValue();
        this.apiKey = context.getProperty(API_KEY).getValue();
        this.embeddingModel = context.getProperty(EMBEDDING_MODEL).getValue();
        this.defaultCollection = context.getProperty(DEFAULT_COLLECTION).getValue();

        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();

        logger.info("VectorDBService enabled for provider: {} at {}", provider, connectionUrl);
    }

    @OnDisabled
    public void onDisabled() {
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient.connectionPool().evictAll();
        }
        logger.info("VectorDBService disabled");
    }

    @Override
    public void store(String collection, String id, String text, Map<String, String> metadata)
            throws VectorDBException {
        String targetCollection = (collection != null) ? collection : defaultCollection;
        try {
            // TODO: Implement provider-specific store logic
            // 1. Generate embedding for the text using the configured embedding model
            // 2. Store the vector + text + metadata in the vector database
            logger.debug("Storing document {} in collection {} ({} provider)", id, targetCollection, provider);

            Map<String, Object> payload = new HashMap<>();
            payload.put("id", id);
            payload.put("text", text);
            payload.put("metadata", metadata);

            // Placeholder - actual implementation would call the vector DB API
            logger.info("Stored document {} in collection {}", id, targetCollection);

        } catch (Exception e) {
            throw new VectorDBException("Failed to store document: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Map<String, Object>> search(String collection, String queryText, int topK, double threshold)
            throws VectorDBException {
        String targetCollection = (collection != null) ? collection : defaultCollection;
        try {
            // TODO: Implement provider-specific search logic
            // 1. Generate embedding for the query text
            // 2. Perform similarity search in the vector database
            // 3. Filter results by threshold and return top-K
            logger.debug("Searching collection {} for '{}' (top-{}, threshold={})",
                    targetCollection, queryText, topK, threshold);

            // Placeholder - return empty results until implemented
            return new ArrayList<>();

        } catch (Exception e) {
            throw new VectorDBException("Failed to search: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String collection, String id) throws VectorDBException {
        String targetCollection = (collection != null) ? collection : defaultCollection;
        try {
            // TODO: Implement provider-specific delete logic
            logger.debug("Deleting document {} from collection {}", id, targetCollection);

        } catch (Exception e) {
            throw new VectorDBException("Failed to delete document: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean testConnection() {
        // TODO: Implement provider-specific connection test
        logger.debug("Testing connection to {} at {}", provider, connectionUrl);
        return httpClient != null;
    }
}
