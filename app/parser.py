import pymupdf
import re 

def clean_text(text):

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    text = text.strip()

    return text


def extract_text(PDF_PATH):

    doc = pymupdf.open(PDF_PATH)

    pages = []

    for page_number , page in enumerate(doc , start=1):
        text = page.get_text()

        pages.append({
            "page" : page_number,
            "text" : text
        })

    doc.close()
    return pages 


if __name__ == "__main__":
    pages = extract_text("data/document/DeliberatePractice(PsychologicalReview).pdf")

    print(pages[0])
