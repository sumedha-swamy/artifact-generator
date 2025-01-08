from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from document_processor import DocumentProcessor
from pydantic import BaseModel

class URLRequest(BaseModel):
    url: str

app = FastAPI()
document_processor = DocumentProcessor()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/documents")
async def get_documents():
    return await document_processor.get_all_documents()

@app.post("/api/documents/process")
async def process_document(file: UploadFile):
    try:
        result = await document_processor.process_document(file)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 

@app.post("/api/documents/process-url")
async def process_url(request: URLRequest):
    try:
        result = await document_processor.process_url(request.url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: int):
    try:
        await document_processor.remove_document(doc_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) 
    