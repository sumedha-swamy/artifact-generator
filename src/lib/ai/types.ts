import { Section } from '@/app/lib/types';

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSections(title: string, purpose: string): Promise<Section[]>;
  generateSection(
    documentTitle: string,
    documentPurpose: string,
    sectionInfo: SectionGenerationRequest
  ): Promise<SectionGenerationResponse>;
}

export interface SectionGenerationRequest {
  sectionTitle: string;
  sectionDescription: string;
  objective?: string;
  keyPoints?: string[];
  estimatedLength?: string;
  targetAudience?: string;
  otherSections: {
    title: string;
    content: string;
  }[];
}

export interface SectionGenerationResponse {
  content: string;
  strength: number;
}


