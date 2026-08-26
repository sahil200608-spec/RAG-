from app.parser import clean_text
from app.parser import extract_text
from app.chunker import chunk_pages
from app.embedd import embedder
from app.vector_store import save_To_db;

def ingest (FILE_PATH):
    pages = extract_text(FILE_PATH)

    chunks = chunk_pages(pages)

    output = embedder(chunks)


    save_To_db(output);

    return {
        "pages": len(pages),
        "chunks": len(chunks),
        "status": "ready"
    }

    
if __name__ == "__main__":
    result = ingest("data/document/DeliberatePractice(PsychologicalReview).pdf")
    print(result)
    