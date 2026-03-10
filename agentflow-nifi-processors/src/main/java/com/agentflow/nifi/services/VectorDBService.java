/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file for details.
 * Licensed under the Apache License, Version 2.0.
 */
package com.agentflow.nifi.services;

import org.apache.nifi.controller.ControllerService;

import java.util.List;
import java.util.Map;

/**
 * Controller Service interface for managing connections to vector databases
 * used for agent memory (Pinecone, ChromaDB, pgvector, Weaviate, etc.).
 *
 * <p>Provides embedding storage and similarity search capabilities for
 * agent long-term memory, knowledge retrieval, and RAG workflows.</p>
 */
public interface VectorDBService extends ControllerService {

    /**
     * Stores a text document with its embedding in the vector database.
     *
     * @param collection the collection/index name
     * @param id         unique identifier for the document
     * @param text       the text content to store
     * @param metadata   additional metadata key-value pairs
     * @throws VectorDBException if the storage operation fails
     */
    void store(String collection, String id, String text, Map<String, String> metadata)
            throws VectorDBException;

    /**
     * Performs a similarity search against stored embeddings.
     *
     * @param collection the collection/index name to search
     * @param queryText  the text to find similar documents for
     * @param topK       maximum number of results to return
     * @param threshold  minimum similarity score (0.0 - 1.0)
     * @return list of matching documents, each containing "id", "text",
     *         "score", and "metadata"
     * @throws VectorDBException if the search operation fails
     */
    List<Map<String, Object>> search(String collection, String queryText, int topK, double threshold)
            throws VectorDBException;

    /**
     * Deletes a document from the vector database by ID.
     *
     * @param collection the collection/index name
     * @param id         the document identifier to delete
     * @throws VectorDBException if the delete operation fails
     */
    void delete(String collection, String id) throws VectorDBException;

    /**
     * Tests connectivity to the vector database.
     *
     * @return true if the database is reachable
     */
    boolean testConnection();

    /**
     * Exception type for vector database errors.
     */
    class VectorDBException extends Exception {
        public VectorDBException(String message) {
            super(message);
        }

        public VectorDBException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
