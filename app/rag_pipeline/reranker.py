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

