from Retrieve import retrieve
from reranker import rerank
from prompt import build_prompt
from LLM import generate_answer


def answer_question(query):

    print("1. Query received:", query)

    results = retrieve(query)
    print("2. Retrieval complete")

    reranked = rerank(query, results)
    print("3. Reranking complete")

    prompt = build_prompt(query, reranked)
    print("4. Prompt built")
    print(prompt)

    answer = generate_answer(prompt)
    print("5. LLM response received")

    

    return answer, reranked

if __name__ == "__main__":

    query = input("Enter the Query: ")

    answer, sources = answer_question(query)

    print("\nAnswer:")
    print(answer)

    print("\nSources:")

    for chunk in sources:
        print(f"Pages: {chunk['pages']}")