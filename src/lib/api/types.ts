export interface ProcessedDocument {
  id: number;
  name: string;
  vector_ids: string[];
  status: 'processing' | 'completed' | 'error';
}

export interface QueryResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
} 