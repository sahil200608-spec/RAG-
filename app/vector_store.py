import chromadb
import json 

client = chromadb.PersistentClient(
    path = "data/chroma"
)

collection = client.get_or_create_collection(
    name = "documents"
)

with open ("data/processed/embeddings.json"  , "r" , encoding= "utf-8") as f :
    data = json.load(f)

chunks = data['chunks']

collection.add(
    ids = [
        str(chunk['chunk_id']) for chunk in chunks
    ],

    embeddings=[
        chunk["embedding"]
        for chunk in chunks
    ],

    documents=[
        chunk['content'] 
        for chunk in chunks
    ],

     metadatas=[
        {
            "pages": ",".join(
                map(str, chunk["pages"])
            )
        }
        for chunk in chunks
    ]
)

print("Chunks added:", len(chunks))