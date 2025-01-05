import { Section } from '@/app/lib/types';

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSections(title: string, purpose: string, temperature?: number): Promise<Section[]>;
  generateSection(
    documentTitle: string,
    documentPurpose: string,
    sectionInfo: SectionGenerationRequest
  ): Promise<SectionGenerationResponse>;
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


