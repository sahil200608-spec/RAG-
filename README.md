# Reader — Document RAG System

A document question-answering system built using **Retrieval-Augmented Generation (RAG)**.

Reader allows users to upload PDFs and ask questions about their contents. It retrieves relevant passages using hybrid search, reranks them, and generates answers using an LLM.

**Tech Stack:** React · FastAPI · ChromaDB · BM25 · Gemini

---

## Overview

```text
PDF
 ↓
Text Extraction
 ↓
Chunking & Embedding
 ↓
Vector Storage
 ↓
Hybrid Search (Vector + BM25)
 ↓
Reciprocal Rank Fusion (RRF)
 ↓
Reranking
 ↓
Prompt Construction
 ↓
LLM
 ↓
Answer + Sources
```

## Architecture

```mermaid
flowchart TD
    A["React UI<br/>PDF Upload · Questions · Answers"]
    B["FastAPI Backend"]
    C["Document Ingestion"]
    D["Parser → Chunker → Embedder"]
    E[("ChromaDB")]
    F["Hybrid Retrieval"]
    G["Vector Search + BM25"]
    H["Reciprocal Rank Fusion (RRF)"]
    I["Reranker"]
    J["Prompt Construction"]
    K["LLM (Gemini)"]
    L["Answer + Sources"]

    A --> B
    B --> C
    C --> D
    D --> E
    B --> F
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> A
```

## Key Features

- PDF text extraction and chunking
- Semantic vector search using ChromaDB
- Keyword retrieval using BM25
- Hybrid retrieval with Reciprocal Rank Fusion
- Reranking for improved relevance
- LLM-generated answers with source passages

## Getting Started

### Backend

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RAG

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python -m uvicorn app.main:app --reload
```

API documentation: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure the required API keys and environment variables before running the application.

---

**Goal:** Build an end-to-end RAG system while understanding the retrieval, ranking, and generation components.