// src/lib/ai/anthropic-provider.ts
import { AIProvider, Section } from './types';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSections(title: string, purpose: string): Promise<Section[]> {
    try {
      const systemPrompt = `You are a helpful assistant that generates document sections. Generate sections that would make sense for the given document title and purpose. Each section should have a clear title and description. Return the response in JSON format with this structure:
      {
        "sections": [
          {
            "title": "string",
            "description": "string"
          }
        ]
      }`;

      const response = await this.client.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `Please generate appropriate sections for a document with the following details:
          Title: ${title}
          Purpose: ${purpose}`
        }]
      });

      // Get the text content from the response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Anthropic API');
      }

      // Parse the JSON response
      const result = JSON.parse(content.text);
      
      // Transform the sections into our Section type
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
      console.error('Error generating sections with Anthropic:', error);
      throw error;
    }
  }
}