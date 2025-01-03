import os
from typing import List, Dict
import tempfile
import time
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from fastapi import UploadFile
import asyncio
import uuid
from config import OPENAI_API_KEY

class DocumentProcessor:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
        self.vector_store = None
        self.document_map = {}  # Maps document IDs to their vector IDs

    async def process_document(self, file: UploadFile) -> Dict:
        # Create a temporary file to store the upload
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            # Select appropriate loader based on file type
            if file.filename.endswith('.pdf'):
                loader = PyPDFLoader(temp_path)
            elif file.filename.endswith('.txt'):
                loader = TextLoader(temp_path)
            elif file.filename.endswith('.docx'):
                loader = Docx2txtLoader(temp_path)
            else:
                raise ValueError("Unsupported file type")

            # Load and split the document
            docs = loader.load()
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            split_docs = splitter.split_documents(docs)

            # Add unique IDs to each chunk
            vector_ids = []
            for doc in split_docs:
                vector_id = str(uuid.uuid4())
                doc.metadata['vector_id'] = vector_id
                vector_ids.append(vector_id)

            # Initialize or update vector store
            if self.vector_store is None:
                self.vector_store = FAISS.from_documents(split_docs, self.embeddings)
            else:
                self.vector_store.add_documents(split_docs)

            # Generate document ID and store mapping
            doc_id = int(time.time() * 1000)
            self.document_map[doc_id] = {
                'vector_ids': vector_ids,
                'name': file.filename
            }

            return {
                'id': doc_id,
                'name': file.filename,
                'vector_ids': vector_ids,
                'status': 'completed'
            }

        except Exception as e:
            if "insufficient_quota" in str(e):
                raise ValueError("OpenAI API quota exceeded. Please check your billing status.")
            elif "invalid_api_key" in str(e):
                raise ValueError("Invalid OpenAI API key. Please check your configuration.")
            else:
                raise ValueError(f"Error processing document: {str(e)}")

        finally:
            # Clean up temporary file
            os.unlink(temp_path)

    async def remove_document(self, doc_id: int) -> None:
        """Remove a document and its vectors from storage."""
        if doc_id not in self.document_map:
            raise ValueError(f"Document ID {doc_id} not found")

        # Get vector IDs associated with this document
        vector_ids = self.document_map[doc_id]['vector_ids']

        # Remove vectors from FAISS store
        if self.vector_store is not None:
            # FAISS doesn't support direct deletion, so we need to rebuild the index
            # excluding the vectors we want to delete
            all_docs = self.vector_store.similarity_search("", k=self.vector_store.index.ntotal)
            remaining_docs = [
                doc for doc in all_docs 
                if doc.metadata.get('vector_id') not in vector_ids
            ]
            
            if remaining_docs:
                # Rebuild index with remaining documents
                self.vector_store = FAISS.from_documents(remaining_docs, self.embeddings)
            else:
                # If no documents left, reset the vector store
                self.vector_store = None

        # Remove document from our mapping
        del self.document_map[doc_id]

    async def query(self, query: str, top_k: int = 3) -> List[Dict]:
        """Query the vector store for similar documents."""
        if not self.vector_store:
            return []

        results = self.vector_store.similarity_search_with_score(query, k=top_k)
        
        return [{
            'content': doc.page_content,
            'metadata': doc.metadata,
            'score': score
        } for doc, score in results] 