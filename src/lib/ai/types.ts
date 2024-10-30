export type AIProviderType = 'openai' | 'anthropic' | 'bedrock';

export interface AIProvider {
  generateSections(title: string, purpose: string): Promise<Section[]>;
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
}