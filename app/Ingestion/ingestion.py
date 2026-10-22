from app.Ingestion.parser import clean_text
from app.Ingestion.parser import extract_text
from app.Ingestion.chunker import chunk_pages
from app.Ingestion.embedd import embedder
from app.Ingestion.vector_store import save_To_db
from app.rag_pipeline.keyword_store import keyword_store

def ingest (FILE_PATH):
    pages = extract_text(FILE_PATH)

    chunks = chunk_pages(pages)

    output = embedder(chunks)

    save_To_db(output)

    print("BM25 index built:", keyword_store.bm25 is not None)
    print("Chunks in BM25:", len(keyword_store.chunks))

    keyword_store.build(output)

    return {
        "pages": len(pages),
        "chunks": len(chunks),
        "status": "ready"
    }


    