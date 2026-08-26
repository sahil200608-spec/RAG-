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
Retrieval
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

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │                      │
                         │  PDF Upload          │
                         │  Question Input      │
                         │  Answer + Sources    │
                         └──────────┬───────────┘
                                    │
                              HTTP / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
             Document Upload                    Question
                    │                               │
                    ▼                               ▼
              Ingestion Pipeline              RAG Pipeline
                    │                               │
          ┌─────────┼─────────┐          ┌────────┼────────┐
          ▼         ▼         ▼          ▼        ▼        ▼
       Parser    Chunker   Embedder   Retrieve  Rerank   Prompt
          │         │         │          │        │        │
          └─────────┴─────────┘          │        │        │
                    │                    └────┬───┘        │
                    ▼                         ▼            ▼
              ChromaDB                 Relevant Context   LLM
                                                         │
                                                         ▼
                                                   Answer + Sources