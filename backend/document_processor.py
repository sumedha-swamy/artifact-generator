import os
from typing import List, Dict, Optional
import tempfile
import time
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader, WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from fastapi import UploadFile
import asyncio
import uuid
from config import AI_API_KEY
from urllib.parse import urlparse
import logging
import json

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(openai_api_key=AI_API_KEY)
        self.vector_store = None
        self.document_map = {}
        self.storage_dir = "storage"
        self.load_persistent_storage()

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
                chunk_overlap=400
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

            # Save changes to persistent storage
            self.save_persistent_storage()

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
            all_docs = self.vector_store.similarity_search("", k=self.vector_store.index.ntotal)
            remaining_docs = [
                doc for doc in all_docs 
                if doc.metadata.get('vector_id') not in vector_ids
            ]
            
            if remaining_docs:
                self.vector_store = FAISS.from_documents(remaining_docs, self.embeddings)
            else:
                self.vector_store = None

        # Remove document from our mapping
        del self.document_map[doc_id]
        
        # Save changes to disk
        self.save_persistent_storage()

    async def query(self, query: str, top_k: int = 3, source_filter: Optional[List[str]] = None) -> List[Dict]:
        try:
            if self.vector_store is None:
                return []

            # If source filter is provided, use it to filter results
            search_kwargs = {}
            if source_filter:
                search_kwargs["filter"] = {"source": {"$in": source_filter}}

            # Perform the search
            results = self.vector_store.similarity_search_with_score(
                query,
                k=top_k,
                **search_kwargs
            )

            # Format results
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score)
                })

            return formatted_results
        except Exception as e:
            logger.error(f"Error querying vector store: {str(e)}")
            raise

    async def process_url(self, url: str) -> Dict:
        try:
            # Validate URL
            result = urlparse(url)
            if not all([result.scheme, result.netloc]):
                raise ValueError("Invalid URL format")

            # Create a unique ID for this URL
            doc_id = int(time.time() * 1000)

            # Use LangChain's WebBaseLoader
            loader = WebBaseLoader(url)
            docs = await asyncio.to_thread(loader.load)  # Run in thread to not block

            # Split documents
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
                doc.metadata['source_url'] = url
                vector_ids.append(vector_id)

            # Add to vector store
            if self.vector_store is None:
                self.vector_store = FAISS.from_documents(split_docs, self.embeddings)
            else:
                self.vector_store.add_documents(split_docs)

            # Store mapping
            self.document_map[doc_id] = {
                'vector_ids': vector_ids,
                'name': result.netloc,  # Use domain as name
                'url': url
            }

            return {
                'id': doc_id,
                'name': result.netloc,
                'vector_ids': vector_ids,
                'status': 'completed',
                'type': 'url'
            }

        except Exception as e:
            logger.error(f"Error processing URL: {str(e)}")
            raise 

    async def get_all_documents(self) -> List[Dict]:
        """Return all documents in storage."""
        # Simply return an empty list if no documents exist
        return [
            {
                'id': doc_id,
                'name': info['name'],
                'status': 'completed',
                'path': info.get('url', '')
            }
            for doc_id, info in self.document_map.items()
        ] 

    def save_persistent_storage(self):
        """Save FAISS index and document mappings to disk."""
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Save document mappings
        mapping_path = os.path.join(self.storage_dir, "document_map.json")
        with open(mapping_path, 'w') as f:
            json.dump(self.document_map, f)
        
        # Save FAISS index
        if self.vector_store is not None:
            index_path = os.path.join(self.storage_dir, "faiss_index")
            self.vector_store.save_local(index_path) 

    def load_persistent_storage(self):
        """Load persisted FAISS index and document mappings."""
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Load document mappings
        mapping_path = os.path.join(self.storage_dir, "document_map.json")
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                self.document_map = json.load(f)
        
        # Load FAISS index
        index_path = os.path.join(self.storage_dir, "faiss_index")
        if os.path.exists(index_path):
            self.vector_store = FAISS.load_local(
                index_path, 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
        else:
            # Initialize empty vector store if no existing index
            self.vector_store = FAISS.from_texts(
                [""], 
                self.embeddings
            ) 