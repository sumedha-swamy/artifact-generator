from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

@app.post("/api/documents/process", response_model=ProcessedDocument)
async def process_document(file: UploadFile):
    logger.debug(f"Processing document: {file.filename}")
    try:
        result = await doc_processor.process_document(file)
        logger.debug(f"Document processed successfully: {result}")
        return result
    except Exception as e:
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

@app.post("/api/query")
async def query_documents(query: str, top_k: int = 3):
    logger.debug(f"Querying documents with: {query}")
    try:
        results = await doc_processor.query(query, top_k)
        logger.debug(f"Query returned {len(results)} results")
        return results
    except Exception as e:
        logger.error(f"Error querying documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000) 