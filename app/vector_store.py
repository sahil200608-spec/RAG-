import chromadb
import json 

def save_To_db(chunks):

    client = chromadb.PersistentClient(
        path = "data/chroma"
    )

    collection = client.get_or_create_collection(
        name = "documents"
    )



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

    return {

        "chunks_added": len(chunks),

        "collection": "documents"

    }

