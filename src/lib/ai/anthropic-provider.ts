// src/lib/ai/anthropic-provider.ts
import { AIProvider, Section, SectionGenerationRequest, SectionGenerationResponse } from './types';
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

  async generateSection(
    documentTitle: string,
    documentPurpose: string,
    sectionInfo: SectionGenerationRequest
  ): Promise<SectionGenerationResponse> {
    try {
      // Generate content
      const contentResponse = await this.client.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Generate content for a section with the following context:
          
          Document Title: ${documentTitle}
          Document Purpose: ${documentPurpose}
          
          Section to Generate:
          Title: ${sectionInfo.sectionTitle}
          Description: ${sectionInfo.sectionDescription}
          
          Other Sections in the Document:
          ${sectionInfo.otherSections.map(section => `
            ${section.title}:
            ${section.content}
          `).join('\n')}
          
          Generate comprehensive, clear, and cohesive content for the specified section.`
        }]
      });

      const generatedContent = contentResponse.content[0].type === 'text' 
        ? contentResponse.content[0].text 
        : '';

      // Evaluate content
      const evaluationResponse = await this.client.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Evaluate this content for the section "${sectionInfo.sectionTitle}" with description "${sectionInfo.sectionDescription}" on a scale of 1-100 based on:
          1. Clarity and crispness (30 points)
          2. Comprehensiveness of information (40 points)
          3. Quality and readability (30 points)
          
          Provide only a number as response, nothing else.
          
          Content to evaluate:
          ${generatedContent}`
        }]
      });

      const strengthText = evaluationResponse.content[0].type === 'text' 
        ? evaluationResponse.content[0].text 
        : '0';
      const strength = parseInt(strengthText);

      return {
        content: generatedContent,
        strength: strength
      };
    } catch (error) {
      console.error('Error generating section with Anthropic:', error);
      throw error;
    }
  }
}