import { AIProvider, Section } from './types';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export class BedrockProvider implements AIProvider {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(region: string, modelId: string = "anthropic.claude-v2") {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  async generateSections(title: string, purpose: string): Promise<Section[]> {
    try {
      const prompt = `Please generate appropriate sections for a document with the following details:
        Title: ${title}
        Purpose: ${purpose}
        
        Return the sections in a format that includes title and description for each section.`;

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          prompt,
          max_tokens_to_sample: 1024,
          temperature: 0.7
        }),
        contentType: "application/json",
        accept: "application/json",
      });

      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));

      return result.sections.map((section: any, index: number) => ({
        id: `section-${index + 1}`,
        title: section.title,
        description: section.description,
        content: "",
        strength: 100,
        isEditing: false,
        isGenerating: false,
        selectedSources: []
      }));
    } catch (error) {
      console.error('Error generating sections with Bedrock:', error);
      throw error;
    }
  }
}