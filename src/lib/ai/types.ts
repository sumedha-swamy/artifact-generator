import { Section } from '@/app/lib/types';

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSections(title: string, purpose: string, domain?: string): Promise<Section[]>;
  generateSection(
    documentTitle: string,
    documentPurpose: string,
    sectionInfo: SectionGenerationRequest,
    domain?: string,
    styleGuide?: string,
    selectedSources?: string[]
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
}

export interface SectionGenerationResponse {
  content: string;
  strength: number;
}


