import { AIProvider, SectionGenerationRequest, SectionGenerationResponse } from './types';
import OpenAI from 'openai';
import { Section } from '@/app/lib/types';
import { DocumentService } from '../api/document-service';
import { QueryResult } from '../api/types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4-turbo-preview") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateSections(title: string, purpose: string, domain: string = "Product Management"): Promise<Section[]> {
    try {
      const systemPrompt = `You are an expert document architect with deep experience in ${domain}. You excel at creating logical, comprehensive document structures that follow industry best practices.`;

      const userPrompt = `As an expert in ${domain}, create a structured outline for a document with the following details:

Title: ${title}
Purpose: ${purpose}

Generate sections that would create a compelling and comprehensive document. Each section must:
- Follow ${domain} industry best practices
- Progress logically from introduction to conclusion
- Cover all essential aspects of the topic
- Be clearly scoped and focused

Return ONLY a JSON object in this exact format:
{
  "sections": [
    {
      "title": "string",
      "description": "string", 
      "objective": "string",
      "key_points": ["string"],
      "estimated_length": "string",
      "target_audience": "string"
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
      });

      const content = response.choices[0].message.content?.trim() || "{}";
      
      // Clean the response if it contains markdown code blocks
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      let result;
      try {
        result = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse JSON:', jsonContent);
        throw new Error('Invalid JSON response from AI');
      }

      if (!result.sections || !Array.isArray(result.sections)) {
        throw new Error("Invalid response structure from OpenAI");
      }
      
      // Transform the API response into our Section type
      return result.sections.map((section: any, index: number) => ({
        id: `section-${index + 1}`,
        title: section.title,
        description: section.description,
        objective: section.objective,
        keyPoints: section.key_points,
        estimatedLength: section.estimated_length,
        targetAudience: section.target_audience,
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
    sectionInfo: SectionGenerationRequest,
    domain: string = "general",
    styleGuide: string = "professional",
    selectedSources?: string[]
  ): Promise<SectionGenerationResponse> {
    try {
      // Get relevant context from vector store with source filter
      const contextResults = await DocumentService.queryContext({
        description: sectionInfo.sectionDescription,
        content: sectionInfo.content || '',
        selectedSources
      });

      // Format context for the prompt
      const relevantContext = contextResults.results
        .map((result: QueryResult) => `Source: ${result.metadata.source || 'Document'}
Content: ${result.content}
---`).join('\n');

      const systemPrompt = `You are a senior content specialist in ${domain} writing a section that fits seamlessly within a larger document. Use the provided reference materials to enrich your writing while maintaining narrative flow and coherence.`;

      const userPrompt = `Write the "${sectionInfo.sectionTitle}" section of a ${domain} document using the provided reference materials.

Context:
Document: "${documentTitle}"
Purpose: ${documentPurpose}
Section Objective: ${sectionInfo.objective || 'Not specified'}
Target Audience: ${sectionInfo.targetAudience || 'General audience'}
Expected Length: ${sectionInfo.estimatedLength || 'As needed for comprehensive coverage'}

Document Flow:
${sectionInfo.otherSections.length > 0 
  ? `Previous Section: "${sectionInfo.otherSections[sectionInfo.otherSections.length - 1]?.title}"
Next Section: "${sectionInfo.otherSections[0]?.title}"`
  : 'This is a standalone section'}

Key Points to Address:
${(sectionInfo.keyPoints || []).map(point => `• ${point}`).join('\n')}

Reference Materials:
${relevantContext}

Writing Guidelines:
1. Incorporate insights from the reference materials naturally
2. Do NOT write an introduction or conclusion
3. Start directly with the subject matter
4. Focus on this section's specific topic
5. Use ${domain}-specific terminology
6. Maintain ${styleGuide} style
7. Format with clear subheadings and lists where appropriate

Content should flow seamlessly with surrounding sections while leveraging the provided reference materials.`;

      console.log("System Prompt:", systemPrompt);
      console.log("User Prompt:", userPrompt);

      // Generate content
      const contentResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      });

      const generatedContent = contentResponse.choices[0].message.content || "";

      // Enhanced evaluation prompt focusing on flow and integration
      const evaluationPrompt = `You are an expert content evaluator in ${domain}. Evaluate the given content on a scale of 1-100 based on:
1. Integration with document flow (40 points)
   - No redundant introduction/conclusion
   - Natural continuation from previous section
   - Smooth lead-in to next section
2. Content quality (30 points)
   - Appropriate depth
   - Industry expertise
   - Clear structure
3. Writing style (30 points)
   - Consistent tone
   - Professional language
   - Readability

Provide only a number as response, nothing else.`;

      const evaluationResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: evaluationPrompt },
          { 
            role: "user",
            content: `Evaluate this content for the section "${sectionInfo.sectionTitle}" within the document "${documentTitle}":

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
