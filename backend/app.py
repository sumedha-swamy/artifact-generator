from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uvicorn
import logging

from document_processor import DocumentProcessor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize document processor
doc_processor = DocumentProcessor()

class ProcessedDocument(BaseModel):
    id: int
    name: str
    vector_ids: List[str]
    status: str

class URLRequest(BaseModel):
    url: HttpUrl

class QueryContextRequest(BaseModel):
    description: str
    content: str
    selectedSources: Optional[List[str]] = None

@app.get("/api/documents")
async def get_documents():
    try:
        return await doc_processor.get_all_documents()
    except Exception as e:
        logger.error(f"Error getting documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/process")
async def process_document(file: UploadFile):
    try:
        result = await doc_processor.process_document(file)
        return result
    except ValueError as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: int):
    logger.debug(f"Deleting document: {doc_id}")
    try:
        await doc_processor.remove_document(doc_id)
        logger.debug(f"Document {doc_id} deleted successfully")
        return {"status": "success"}
    except ValueError as e:
        logger.error(f"Document not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/process-url", response_model=ProcessedDocument)
async def process_url(request: URLRequest):
    try:
        result = await doc_processor.process_url(str(request.url))
        return result
    except ValueError as e:
        logger.error(f"Error processing URL: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/query-context")
async def query_context(request: QueryContextRequest):
    try:
        query = f"{request.description}\n{request.content}"
        results = await doc_processor.query(
            query, 
            top_k=5,
            source_filter=request.selectedSources
        )
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in query_context: {str(e)}")
        # Return empty results instead of throwing error
        return {"results": []}

if __name__ == "__main__":
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000) 