import { Section } from '@/app/lib/types';

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSection(
    jsonString: string,
    temperature: number,
    estimatedLength: string
  ): Promise<SectionGenerationResponse>;
  generatePlan(title: string, purpose: string): Promise<Section[]>;
  generateInitialPlan(title: string, purpose: string, references?: string[], dataSources?: string[]): Promise<string>;
  refinePlan(currentPlan: string, feedback: string): Promise<string>;
  finalizePlanToJson(finalPlan: string): Promise<Section[]>;
  evaluateDocument(
    title: string,
    purpose: string,
    sections: Array<{ title: string; content: string; description: string }>
  ): Promise<EvaluationResult>;
  improveSection(
    currentContent: string,
    sectionDescription: string,
    improvements: string[],
    keyPoints: string[]
  ): Promise<string>;
}

export interface SectionGenerationRequest {
  sectionTitle: string;
  sectionDescription: string;
  content?: string;
  objective?: string;
  keyPoints?: string[];
  estimatedLength: string;
  targetAudience?: string;
  otherSections: Array<{ title: string; content?: string }>;
  temperature: number;
  selectedSources?: string[];
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


