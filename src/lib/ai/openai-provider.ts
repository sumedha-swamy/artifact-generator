import { AIProvider, Section } from './types';
import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSections(title: string, purpose: string): Promise<Section[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates document sections. Generate sections that would make sense for the given document title and purpose. Each section should have a clear title and description."
          },
          {
            role: "user",
            content: `Please generate appropriate sections for a document with the following details:
            Title: ${title}
            Purpose: ${purpose}
            
            Return the sections in a format that includes title and description for each section.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Transform the API response into our Section type
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
      console.error('Error generating sections with OpenAI:', error);
      throw error;
    }
  }
}