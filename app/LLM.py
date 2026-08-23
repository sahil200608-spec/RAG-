from google import genai
from dotenv import load_dotenv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

client = genai.Client()


def generate_answer(prompt):

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text


if __name__ == "__main__":

    prompt = """
    Explain deliberate practice in two sentences.
    """

    answer = generate_answer(prompt)

    print(answer)