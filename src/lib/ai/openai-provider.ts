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

  async generateSections(
    title: string,
    purpose: string,
    domain: string = "Product Management",
    temperature: number = 0.7
  ): Promise<Section[]> {
    try {
      const systemPrompt = `You are an expert document architect with deep experience in ${domain}. Your specialty is creating cohesive, flowing document structures where each section naturally leads into the next, forming a single unified narrative.`;

      const userPrompt = `As an expert in ${domain}, create a structured outline for a document with the following details:

Title: ${title}
Purpose: ${purpose}

Generate sections that form a single, cohesive document. The sections must:
- Flow naturally from one to the next, building a complete narrative
- Avoid redundant introductions or conclusions within sections
- Share information progressively, with each section building upon previous sections
- Maintain consistent tone and style throughout
- Follow ${domain} industry best practices
- Cover all essential aspects of the topic

Return ONLY a JSON object in this exact format:
{
  "sections": [
    {
      "title": "string",
      "description": "string", 
      "objective": "string",
      "key_points": ["string"],
      "estimated_length": "string",
      "target_audience": "string",
      "transition_notes": {
        "from_previous": "string",
        "to_next": "string"
      }
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: temperature,
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
        transitionNotes: section.transition_notes || { from_previous: "", to_next: "" },
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
      console.log('Generation parameters:', {
        length: sectionInfo.estimatedLength,
        temperature: sectionInfo.temperature
      });

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

      const systemPrompt = `You are a senior content specialist in ${domain} writing a section that must flow seamlessly within a larger document. Your specialty is creating content that naturally connects with surrounding sections, avoiding redundant introductions or conclusions. The section should read as if it's part of a single, cohesive document rather than a standalone piece.`;

      // Find the previous and next sections
      const currentIndex = sectionInfo.otherSections.findIndex(s => s.title === sectionInfo.sectionTitle);
      const previousSection = currentIndex > 0 ? sectionInfo.otherSections[currentIndex - 1] : null;
      const nextSection = currentIndex < sectionInfo.otherSections.length - 1 ? sectionInfo.otherSections[currentIndex + 1] : null;

      const userPrompt = `Write the "${sectionInfo.sectionTitle}" section of a ${domain} document, ensuring it flows naturally within the larger document.

Context:
Document: "${documentTitle}"
Purpose: ${documentPurpose}
Section Objective: ${sectionInfo.objective || 'Not specified'}
Section Description: ${sectionInfo.sectionDescription}
Target Audience: ${sectionInfo.targetAudience || 'General audience'}
Expected Length: ${sectionInfo.estimatedLength || 'As needed for comprehensive coverage'}

Document Flow:
${previousSection 
  ? `Previous Section: "${previousSection.title}"}
Content: ${previousSection.content || 'Not yet written'}`
  : 'This is the first section'}
${nextSection 
  ? `\nNext Section: "${nextSection.title}"}
Content: ${nextSection.content || 'Not yet written'}`
  : '\nThis is the last section'}

Current Draft Content:
${sectionInfo.content ? `\nExisting Draft:\n${sectionInfo.content}` : 'No existing draft'}

Key Points to Address:
${(sectionInfo.keyPoints || []).map(point => `• ${point}`).join('\n')}

Reference Materials:
${relevantContext}

Writing Guidelines:
1. Use proper markdown formatting
2. Ensure smooth transitions from the previous section's content
3. Set up natural progression to the next section's topic
4. NO standalone introductions or conclusions within the section
5. Maintain consistent terminology and style with surrounding sections
6. Use ${domain}-specific terminology
7. Maintain ${styleGuide} style
8. Format with clear hierarchy using markdown headings
9. Target approximately ${sectionInfo.estimatedLength} in length

Remember: This section is part of a larger document. Write it to flow seamlessly with surrounding sections, avoiding any redundant context that's already covered elsewhere.`;

      console.log("System Prompt:", systemPrompt);
      console.log("User Prompt:", userPrompt);

      // Generate content with specified temperature
      const contentResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: sectionInfo.temperature ?? 0.7, // Ensure fallback
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
