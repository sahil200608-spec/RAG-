import chromadb
from app.rag_pipeline.keyword_store import keyword_store
from sentence_transformers import SentenceTransformer 

client = chromadb.PersistentClient(
    path ="data/chroma"
)

collection = client.get_collection(
    name = "documents"
)

model = SentenceTransformer("all-MiniLM-L6-v2")

def vector_retrieve(query, k=10):
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
            "distance": results["distances"][0][i],
            "chunk_id": results["ids"][0][i]
        })

    return retrieved_chunks

def keyword_retreive(query , k =10):
    return Keyword_store.search(query , k)

def reciprocal_rank_fusion(result_list , k =60):

    scores ={}
    documents = {}

    for results in result_list:

       for rank , document in enumerate(results , start =1):
           chunk_id = document["chunk_id"]

           scores[chunk_id]= (
               scores.get(chunk_id,0)+1/ (k+rank)
           )

           documents[chunk_id] = document

    ranked_ids = sorted(
        scores,
        key = scores.get,
        reverse=True
    )

    return [
        {
            **documents[chunk_id],
            "rrf_score" : scores[chunk_id]
        }
        for chunk_id in ranked_ids
    ]

def hybrid_search(query , k =10):
    vector_results = vector_retrieve(query , k)
    print("BM25 index available:", keyword_store.bm25 is not None)
    print("Chunks available:", len(keyword_store.chunks))
    keyword_results = keyword_store.search(query ,k)

    fused_results = reciprocal_rank_fusion(
          [vector_results, keyword_results]
    ) 

    return fused_results[:k]
