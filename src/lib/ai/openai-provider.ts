import { AIProvider, SectionGenerationRequest, SectionGenerationResponse } from './types';
import OpenAI from 'openai';
import { Section } from '@/app/lib/types';
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
    styleGuide: string = "professional"
  ): Promise<SectionGenerationResponse> {
    try {
      const systemPrompt = `You are a senior content specialist in ${domain} writing a section that fits seamlessly within a larger document. Your role is to create content that flows naturally from the previous section and into the next, without standalone introductions or conclusions. Focus on the specific topic of this section while maintaining narrative continuity with the surrounding content.`;

      const userPrompt = `Write the "${sectionInfo.sectionTitle}" section of a ${domain} document. This is NOT a standalone piece - it's part of a larger document.

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

Writing Guidelines:
1. Do NOT write an introduction, conclusion, or a summary for this section
2. Start directly with the subject matter, assuming reader context from previous sections
3. Focus purely on this section's specific topic and objectives
4. Use ${domain}-specific terminology naturally
5. Maintain ${styleGuide} style throughout
6. Format with clear subheadings and lists where appropriate

Content should flow as if reading a chapter in a book - picking up from the previous section and leading into the next.`;

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
