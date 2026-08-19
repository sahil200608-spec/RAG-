from sentence_transformers import SentenceTransformer
import json
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("data/processed/embeddings.json", "r", encoding="utf-8") as f:
    data = json.load(f)

chunks = data["chunks"]


query = "What is deliberate practice?"


query_embedding = model.encode(query)

results=[]

for chunk in chunks:

    chunk_embedding = np.array(chunk["embedding"])

    similarity = np.dot(query_embedding, chunk_embedding)/(
        np.linalg.norm(query_embedding)*
        np.linalg.norm(chunk_embedding)
    )

    results.append({
        "chunk": chunk,
        "score": similarity
    })

results.sort(key = lambda x : x["score"] , reverse=True );

top_k = 3

for result in results[:top_k]:

    print("Score:", result["score"])

    print("Pages:", result["chunk"]["pages"])

    print("Content:", result["chunk"]["content"])

    print("-" * 80)
