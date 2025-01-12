import { Section } from '@/app/lib/types';

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSection(request: SectionGenerationRequest): Promise<SectionGenerationResponse>;
  generatePlan(title: string, purpose: string, references?: string[], dataSources?: string[]): Promise<string>;
  generateInitialPlan(
    title: string,
    purpose: string,
    references?: string[],
    dataSources?: string[]
  ): Promise<string>;
  refinePlan(currentPlan: string, feedback: string): Promise<string>;
  finalizePlanToJson(finalPlan: string): Promise<Section[]>;
  evaluateDocument(
    title: string,
    purpose: string,
    sections: Array<{ title: string; content: string; description: string }>
  ): Promise<EvaluationResult>;
  improveSection(
    currentContent: string,
    sectionTitle: string,
    sectionDescription: string,
    improvements: string[],
    keyPoints: string[],
    estimatedLength?: string,
    relevantContext?: any[]
  ): Promise<SectionGenerationResponse>;
  runAgentOrchestrator(
    title: string, 
    purpose: string
  ): Promise<{ 
    type: "prfaq" | "presentation" | "generic";
    description?: string;
  }>;
  generatePRFAQPlan(
    title: string,
    productDescription: string,
    selectedSources?: string[],
    references?: string[],
    dataSources?: string[]
  ): Promise<string>;
}

export interface SectionGenerationRequest {
  sectionTitle: string;
  sectionDescription: string;
  objective: string;
  keyPoints?: string[];
  estimatedLength: string;
  temperature?: number;
  documentType: 'PRFAQ' | 'Presentation' | 'Generic';
  previousContent?: string;
  previousSection?: {
    title: string;
    content: string;
  };
  nextSection?: {
    title: string;
    content: string;
  };
  relevantContext?: Array<{
    content: string;
    metadata: {
      source_url: string;
    };
    score: number;
  }>;
}

export interface SectionGenerationResponse {
  content: string;
  strength: number;
}

export interface EvaluationResult {
  overallScore: number;
  categories: {
    readability: number;
    relevance: number;
    completeness: number;
    factualSupport: number;
    persuasiveness: number;
    consistency: number;
  };
  improvements: string[];
  detailedFeedback: string;
}


