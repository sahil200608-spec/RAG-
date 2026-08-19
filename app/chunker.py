import json 

def chunk_pages(pages, chunk_size=500, overlap=50):

    words = []

    for page in pages:
        page_number = page["page"]
        page_words = page["text"].split()

        for word in page_words:
            words.append((page_number, word))

    chunks = []

    step = chunk_size - overlap

    for start in range(0, len(words), step):

        end = start + chunk_size

        chunk_words = words[start:end]

        if not chunk_words:
            break

        pages_in_chunk = sorted(
            set(page for page, word in chunk_words)
        )

        content = " ".join(
            word for page, word in chunk_words
        )

        chunks.append({
            "chunk_id": len(chunks),
            "pages": pages_in_chunk,
            "content": content
        })

        if end >= len(words):
            break

    return chunks

if __name__ == "__main__":
    from parser import extract_text

    pages = extract_text("data/document/DeliberatePractice(PsychologicalReview).pdf")

    chunks = chunk_pages(pages)

    print("Number of chunks:", len(chunks))

    with open("data/processed/chunks.json", "w", encoding="utf-8") as f:
        json.dump({"chunks": chunks}, f, indent=2, ensure_ascii=False)