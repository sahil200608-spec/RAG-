from app.Retrieve import retrieve
from app.reranker import rerank
from app.prompt import build_prompt
from app.LLM import generate_answer


def answer_question(query):

    results = retrieve(query)

    reranked = rerank(query, results)

    prompt = build_prompt(query, reranked)

    answer = generate_answer(prompt)

    return answer, reranked

