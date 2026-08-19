from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("data/processed/chunks.json", "r", encoding="utf-8") as f:
    data = json.load(f)

chunks = data["chunks"]

print("Chunks before saving:", len(chunks))

embeddings = []

for chunk in chunks:
    text = chunk["content"]
    embeddings.append(model.encode(text))

for i, chunk in enumerate(chunks):
    chunk["embedding"] = embeddings[i].tolist()

output = {
    "chunks": chunks
}

with open("data/processed/embeddings.json", "w", encoding="utf-8") as f:
    json.dump(output, f , indent=2)

print("Chunks:", len(chunks))
print("Embeddings:", len(embeddings))    

print("Embeddings saved successfully.")