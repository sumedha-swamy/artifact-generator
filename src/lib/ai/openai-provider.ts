import { AIProvider, Section, SectionGenerationRequest, SectionGenerationResponse } from './types';
import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4-turbo-preview") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateSections(title: string, purpose: string): Promise<Section[]> {
    try {
      const systemPrompt = `You are a helpful assistant that generates document sections. Generate sections that would make sense for the given document title and purpose. Each section should have a clear title and description. Return the response in this exact JSON format, and nothing else. Ensure that the response is valid JSON and that the sections array is not empty:
      {
        "sections": [
          {
            "title": "string",
            "description": "string"
          }
        ]
      }`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please generate appropriate sections for a document with the following details:
            Title: ${title}
            Purpose: ${purpose}`
          }
        ],
        temperature: 0.7,
      });

      // Log the response content for debugging
      console.log('OpenAI response:', response.choices[0].message.content);      
      
      // Parse the JSON response from the message content
      const result = JSON.parse(response.choices[0].message.content || "{}");
      if (!result.sections) {
        throw new Error("Invalid response from OpenAI");
      }
      
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

  async generateSection(
    documentTitle: string,
    documentPurpose: string,
    sectionInfo: SectionGenerationRequest
  ): Promise<SectionGenerationResponse> {
    try {
      // First, generate the section content
      const contentResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Generate content for a section of a document, ensuring it's cohesive with the rest of the document and meets the section's objectives. The content should be clear, comprehensive, and well-written.`
          },
          {
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
          }
        ],
        temperature: 0.7,
      });

      const generatedContent = contentResponse.choices[0].message.content || "";

      // Then, evaluate the generated content
      const evaluationResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are an expert content evaluator. Evaluate the given content on a scale of 1-100 based on:
            1. Clarity and crispness (30 points)
            2. Comprehensiveness of information (40 points)
            3. Quality and readability (30 points)
            
            Provide only a number as response, nothing else.`
          },
          {
            role: "user",
            content: `Evaluate this content for the section "${sectionInfo.sectionTitle}" with description "${sectionInfo.sectionDescription}":
            
            ${generatedContent}`
          }
        ],
        temperature: 0,
      });

      const strength = parseInt(evaluationResponse.choices[0].message.content || "0");

      return {
        content: generatedContent,
        strength: strength
      };
    } catch (error) {
      console.error('Error generating section with OpenAI:', error);
      throw error;
    }
  }

}