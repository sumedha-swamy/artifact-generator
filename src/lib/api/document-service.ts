import axios, { AxiosError } from 'axios';
import { ProcessedDocument, QueryResult, QueryContextRequest } from './types';

export class DocumentService {
  private static readonly API_BASE_URL = 'http://localhost:8000/api';

  static async processDocument(file: File): Promise<ProcessedDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<ProcessedDocument>(
      `${this.API_BASE_URL}/documents/process`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  static async deleteDocument(docId: number): Promise<void> {
    try {
      await axios.delete(`${this.API_BASE_URL}/documents/${docId}`);
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        console.warn(`Document ${docId} not found, might have been already deleted`);
        return; // Treat as success if document doesn't exist
      }
      throw error; // Re-throw other errors
    }
  }

  static async queryDocuments(query: string, topK: number = 3): Promise<QueryResult[]> {
    const response = await axios.post<QueryResult[]>(`${this.API_BASE_URL}/query`, {
      query,
      top_k: topK,
    });

    return response.data;
  }

  static async processUrl(url: string): Promise<ProcessedDocument> {
    const response = await axios.post<ProcessedDocument>(
      `${this.API_BASE_URL}/documents/process-url`,
      { url }
    );
    return response.data;
  }

  static async queryContext(request: QueryContextRequest): Promise<any> {
    const response = await axios.post(
      `${this.API_BASE_URL}/query-context`,
      request
    );
    return response.data;
  }
} 