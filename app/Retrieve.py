import chromadb
from sentence_transformers import SentenceTransformer 

client = chromadb.PersistentClient(
    path ="data/chroma"
)

collection = client.get_collection(
    name = "documents"
)

model = SentenceTransformer("all-MiniLM-L6-v2")

def retrieve(query, k=5):

    query_embedding = model.encode(query).tolist()

    results = collection.query(

        query_embeddings=[query_embedding],

        n_results=k

    )

    retrieved_chunks = []

    for i in range(len(results["documents"][0])):

        retrieved_chunks.append({

            "content": results["documents"][0][i],

            "pages": results["metadatas"][0][i]["pages"],

            "distance": results["distances"][0][i]

        })

    return retrieved_chunks

if __name__ == "__main__":

    results = retrieve(
        "What are the characteristics of deliberate practice?",
        k=3
    )

    for result in results:

        print("\n" + "-" * 80)
        print("Pages:", result["pages"])
        print("Distance:", result["distance"])
        print("Content:", result["content"])