import chromadb
from sentence_transformers import SentenceTransformer 

client = chromadb.PersistentClient(
    path ="data/chroma"
)

collection = client.get_collection(
    name = "documents"
)

model = SentenceTransformer("all-MiniLM-L6-v2")

query = "What is deliberate practice?"

query_embedding = model.encode(query).tolist()

results = collection.query(
    query_embeddings=[query_embedding],
    n_results= 3
)

for i in range(len(results["documents"][0])):

    print("\n" + "-" * 80)

    print("Pages:", results["metadatas"][0][i]["pages"])

    print("Distance:", results["distances"][0][i])

    print("Content:", results["documents"][0][i])