# Reader — Document RAG System

A document question-answering system built around a Retrieval-Augmented Generation (RAG) pipeline.

Reader allows users to upload PDF documents and ask questions about their contents. The system retrieves relevant passages from the uploaded documents, reranks them, builds a grounded prompt, and generates an answer using an LLM.

The project is built with a Python/FastAPI backend and a React frontend.

---

## Overview

Reader follows a complete RAG pipeline:

PDF
 ↓
Text Extraction
 ↓
Chunking
 ↓
Embedding
 ↓
Vector Database
 ↓
Hybrid Search
 ↓
Reranking
 ↓
Prompt Construction
 ↓
LLM
 ↓
Answer + Sources

The goal of the project is to build and understand a complete end-to-end RAG system rather than relying on a single framework to hide the underlying components.

---

## Architecture

`                             ┌──────────────────────────┐
                              │        React UI          │
                              │                          │
                              │  PDF Upload              │
                              │  Question Input          │
                              │  Answer + Sources        │
                              └────────────┬─────────────┘
                                           │
                                     HTTP / REST
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │       FastAPI Backend    │
                              │                          │
                              │  Upload & Ask Endpoints  │
                              └────────────┬─────────────┘
                                           │
                      ┌────────────────────┴────────────────────┐
                      │                                         │
                      ▼                                         ▼
             ┌─────────────────┐                      ┌─────────────────┐
             │ Document Upload │                      │    Question     │
             └────────┬────────┘                      └────────┬────────┘
                      │                                         │
                      ▼                                         ▼
             ┌─────────────────┐                      ┌─────────────────┐
             │    Ingestion    │                      │  RAG Pipeline   │
             │    Pipeline     │                      └────────┬────────┘
             └────────┬────────┘                               │
                      │                                         ▼
          ┌───────────┼───────────┐                   ┌─────────────────────┐
          ▼           ▼           ▼                   │  Hybrid Retrieval   │
      ┌────────┐ ┌─────────┐ ┌──────────┐             └──────────┬──────────┘
      │ Parser │ │ Chunker │ │ Embedder │                        │
      └────────┘ └─────────┘ └──────────┘                        │
          │           │           │                    ┌─────────┴─────────┐
          └───────────┴───────────┘                    │                   │
                      │                                ▼                   ▼
                      ▼                       ┌────────────────┐  ┌────────────────┐
             ┌─────────────────┐               │  Vector Search │  │ Keyword Search │
             │   Embedded      │               │                │  │                │
             │     Chunks      │               │   ChromaDB     │  │   BM25 Index   │
             └────────┬────────┘               └────────┬───────┘  └────────┬───────┘
                      │                                 │                   │
                      ▼                                 └─────────┬─────────┘
             ┌─────────────────┐                                 │
             │    ChromaDB     │                                 ▼
             │ Vector Storage  │                       ┌─────────────────────┐
             └─────────────────┘                       │ Reciprocal Rank     │
                                                       │ Fusion (RRF)        │
                                                       └──────────┬──────────┘
                                                                  │
                                                                  ▼
                                                       ┌─────────────────────┐
                                                       │      Reranker       │
                                                       └──────────┬──────────┘
                                                                  │
                                                                  ▼
                                                       ┌─────────────────────┐
                                                       │  Prompt Construction│
                                                       └──────────┬──────────┘
                                                                  │
                                                                  ▼
                                                       ┌─────────────────────┐
                                                       │         LLM         │
                                                       └──────────┬──────────┘
                                                                  │
                                                                  ▼
                                                       ┌─────────────────────┐
                                                       │   Answer + Sources  │
                                                       └─────────────────────┘