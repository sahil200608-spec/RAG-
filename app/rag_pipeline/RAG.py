from app.rag_pipeline.Retrieve import hybrid_search
from app.rag_pipeline.reranker import rerank
from app.rag_pipeline.prompt import build_prompt
from app.rag_pipeline.LLM import generate_answer


def answer_question(query):

    results = hybrid_search(query)

    reranked = rerank(query, results)

    prompt = build_prompt(query, reranked)

    answer = generate_answer(prompt)

    return answer, reranked

