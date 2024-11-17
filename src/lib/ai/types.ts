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
  otherSections: {
    title: string;
    content: string;
  }[];
}

export interface SectionGenerationResponse {
  content: string;
  strength: number;
}


export interface Section {
  id: string;
  title: string;
  content: string;
  description: string;
  strength: number;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: string[];
  revisions: Array<{ content: string; description: string }>;
  sourceOption?: string;
}