from sentence_transformers import CrossEncoder

model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)

def rerank(query, chunks , top_k=3):
    pairs = [
        (query , chunk["content"]) for chunk in chunks 
    ]

    scores = model.predict(pairs)

    for chunk , score in zip (chunks , scores):
        chunk["rerank_score"] = float(score)

    chunks.sort(
        key=lambda x : x["rerank_score"],
        reverse =True
    )

    return chunks[:top_k]

if __name__ == "__main__":

    from Retrieve import retrieve

    query = "What are the characteristics of deliberate practice?"

    chunks = retrieve(query, k=10)

    results = rerank(
        query,
        chunks,
        top_k=3
    )

    for result in results:

        print("\n" + "-" * 80)

        print("Pages:", result["pages"])

        print("Vector distance:", result["distance"])

        print("Rerank score:", result["rerank_score"])

        print("Content:", result["content"])