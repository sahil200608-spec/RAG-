from fastapi import APIRouter ,UploadFile, File, HTTPException
from pathlib import Path
from pydantic import BaseModel 
from app.RAG import answer_question
from app.ingestion import ingest

router = APIRouter()

class QuestionRequest(BaseModel):
    query:str

@router.post("/ask")
def  ask_question(request: QuestionRequest):
    answer , sources = answer_question(request.query)

    return{
        "answer" : answer , 
        "sources": sources
    }

UPLOAD_DIR = Path("data/document")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/document/upload")
async def upload_document(file: UploadFile =File(...)):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    result = ingest(str(file_path))

    return {
        "filename": file.filename,
        **result
    }