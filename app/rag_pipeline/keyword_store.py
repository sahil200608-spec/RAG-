from  rank_bm25 import BM25Okapi

class KeywordStore:

    def __init__ (self):
        self.chunks =[]
        self.bm25= None 

    def build(self, chunks):
        self.chunks = chunks

        tokenized_chunks =[
            chunk["content"].lower().split()
            for chunk in chunks 
        ]

        self.bm25 = BM25Okapi(tokenized_chunks)

    def search (self, query , k=10):
        tokens = query.lower().split()

        scores = self.bm25.get_scores(tokens)

        ranked_indices = sorted(
            range(len(scores)),
            key = lambda i : scores[i] ,
            reverse=True
        )[:k]

        result = []

        for i in ranked_indices:
            chunk = self.chunks[i].copy()

            chunk["bm25_score"] = float(scores[i])

            result.append(chunk)

        return result

keyword_store = KeywordStore()


