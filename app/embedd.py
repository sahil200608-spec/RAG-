from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer("all-MiniLM-L6-v2")



def embedder(chunks):

    print("Chunks before saving:", len(chunks))

    embeddings = []

    for chunk in chunks:
        text = chunk["content"]
        embeddings.append(model.encode(text))

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i].tolist()

    
    return chunks


