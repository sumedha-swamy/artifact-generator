export interface ProcessedDocument {
  id: number;
  name: string;
  vector_ids: string[];
  status: 'processing' | 'completed' | 'error';
  path?: string;
}

export interface QueryResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface QueryContextRequest {
  description: string;
  content: string;
  selectedSources?: string[];
} 