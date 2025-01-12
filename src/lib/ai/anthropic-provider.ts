// src/lib/ai/anthropic-provider.ts
import { AIProvider, SectionGenerationRequest, SectionGenerationResponse, EvaluationResult } from './types';
import Anthropic from '@anthropic-ai/sdk';
import { Section } from '@/app/lib/types';
import { DocumentService } from '../api/document-service';
import crypto from 'crypto';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = "claude-3-opus-20240229") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async createMessage(content: string, temperature: number = 0.7): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature,
      messages: [{ role: "user", content }],
      system: "You are a helpful AI assistant specializing in document generation and improvement."
    });

    if (response.content[0].type !== 'text') {
      throw new Error('Unexpected response format from Anthropic API');
    }

    return response.content[0].text;
  }

  public async runAgentOrchestrator(title: string, purpose: string): Promise<{
    type: "prfaq" | "presentation" | "generic";
    description?: string;
    topic?: string;
    query?: string;
  }> {
    try {
      const prompt = `You are an orchestrator. Based on the document title and purpose, determine which type of document to create:
1) prfaq - for product/feature announcements
2) presentation - for slide decks and presentations
3) generic - for other document types

Title: ${title}
Purpose: ${purpose}

Return your response in JSON format with type, description, topic, and query fields.`;

      const response = await this.createMessage(prompt, 0.2);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error in agent orchestrator:', error);
      throw error;
    }
  }

  public async generatePlan(title: string, purpose: string, references: string[] = [], dataSources: string[] = []): Promise<string> {
    return this.generateInitialPlan(title, purpose, references, dataSources);
  }

  public async generateInitialPlan(
    title: string,
    purpose: string,
    references: string[] = [],
    dataSources: string[] = []
  ): Promise<string> {
    const documentType = await this.runAgentOrchestrator(title, purpose);
    
    const documentTypeStr = documentType.type.toLowerCase();
    switch (documentTypeStr) {
      case "prfaq":
        return this.generatePRFAQPlan(title, documentType.description ?? title, references, dataSources);
      case "presentation":
        return this.generateInitialPresentationOutline(title, documentType.topic ?? title);
      case "generic":
        return this.generateGenericPlan(documentType.query ?? title);
      default:
        throw new Error(`Unknown document type: ${documentType.type}`);
    }
  }

  public async generatePRFAQPlan(
    title: string,
    productDescription: string,
    selectedSources?: string[],
    references: string[] = [],
    dataSources: string[] = []
  ): Promise<string> {
    let relevantContext = [];    
    try {
      const queryResponse = await DocumentService.queryContext({
        description: title,
        content: `${productDescription}\n${references.join('\n')}`,
        selectedSources: selectedSources
      });
      relevantContext = queryResponse.results || [];
    } catch (error) {
      console.error('Error fetching context for PRFAQ plan:', error);
    }

    const contextStr = this.formatRelevantContext(relevantContext);
    const prompt = `Create a detailed PRFAQ planning document for:
Title: '${title}'
Description: '${productDescription}'
${contextStr}

Follow the PR/FAQ format with Press Release and FAQ sections.
Include detailed planning notes for each section.
Do not generate actual content.
Focus on structure and requirements for each section.`;

    return this.createMessage(prompt);
  }

  public async refinePlan(previousPlan: string, userFeedback: string): Promise<string> {
    const prompt = `We have this current outline/plan:
${previousPlan}

User feedback:
${userFeedback}

Please refine the plan accordingly.
Return only the updated plan as plain text.`;

    return this.createMessage(prompt, 0.7);
  }

  public async finalizePlanToJson(finalPlan: string): Promise<Section[]> {
    const prompt = `Convert this plan into a JSON array of sections. Each section should have:
- title (string)
- description (string)
- objective (string)
- key_points (string[])
- estimated_length (string)
- target_audience (string)

Plan to convert:
${finalPlan}

IMPORTANT: Return ONLY the raw JSON with no additional text or explanation. The response must start with {"sections": [ and end with ]}`;

    try {
      const response = await this.createMessage(prompt, 0.7);
      const result = JSON.parse(response);
      
      if (!result.sections || !Array.isArray(result.sections)) {
        throw new Error('Invalid JSON structure: missing sections array');
      }

      return result.sections.map((section: any) => ({
        id: crypto.randomUUID(),
        title: section.title,
        description: section.description,
        objective: section.objective,
        keyPoints: section.key_points,
        estimatedLength: section.estimated_length,
        targetAudience: section.target_audience,
        content: '',
        isEditing: false,
        isGenerating: false,
        selectedSources: [],
        sourceOption: 'all',
        revisions: [],
        strength: 0
      }));
    } catch (error) {
      console.error('Error parsing finalized plan:', error);
      throw error;
    }
  }

  public async generateSection(request: SectionGenerationRequest): Promise<SectionGenerationResponse> {
    try {
      const contextStr = this.formatRelevantContext(request.relevantContext);
      
      const prompt = `Generate content for section "${request.sectionTitle}" in a ${request.documentType}.

CONTEXT:
${contextStr}

EXISTING CONTENT:
${request.previousContent ? 'Previous version:\n' + request.previousContent : 'No existing content'}

Previous Section: ${request.previousSection?.title || 'None'}
${request.previousSection?.content ? `${request.previousSection.content.slice(-200)}...` : ''}

Next Section: ${request.nextSection?.title || 'None'}
${request.nextSection?.content ? `${request.nextSection.content.slice(0, 200)}...` : ''}

REQUIREMENTS:
Purpose: ${request.objective}
Key Points: ${request.keyPoints?.join('\n')}
Length: ${request.estimatedLength}

Begin content:`;

      const content = await this.createMessage(prompt, request.temperature ?? 0.7);

      // Evaluate content
      const evaluationPrompt = `Evaluate this content on a scale of 1-100 based on clarity, comprehensiveness, and quality.
Content to evaluate:
${content}

Return only a number.`;

      const strengthResponse = await this.createMessage(evaluationPrompt, 0);
      const strength = parseInt(strengthResponse) || 0;

      return { content, strength };
    } catch (error) {
      console.error('Error generating section:', error);
      throw error;
    }
  }

  public async evaluateDocument(
    title: string,
    purpose: string,
    sections: Array<Section>
  ): Promise<EvaluationResult> {
    const prompt = `Evaluate this document and return a JSON object with exactly this structure:
{
    "overallScore": number,
    "categories": {
        "readability": number,
        "relevance": number,
        "completeness": number,
        "factualSupport": number,
        "persuasiveness": number,
        "consistency": number
    },
    "improvements": string[],
    "detailedFeedback": string
}

Document to evaluate:
TITLE: ${title}
PURPOSE: ${purpose}

SECTIONS:
${sections.map(s => `[Section]: ${s.title}\n[Content]: ${s.content}\n---`).join('\n')}

Return ONLY the JSON object, no other text or explanation.`;

    try {
        const response = await this.createMessage(prompt, 0.2);
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : response;
        const evaluation = JSON.parse(jsonStr) as EvaluationResult;
        this.validateEvaluation(evaluation);
        return evaluation;
    } catch (error) {
        console.error('Failed to evaluate document:', error);
        throw error;
    }
  }

  public async improveSection(
    currentContent: string,
    sectionTitle: string,
    sectionDescription: string,
    improvements: string[],
    keyPoints: string[],
    estimatedLength: string = 'medium',
    relevantContext?: any[]
  ): Promise<SectionGenerationResponse> {
    try {
      const contextStr = this.formatRelevantContext(relevantContext);
      const prompt = `Improve this content for section "${sectionTitle}":

CURRENT CONTENT:
${currentContent}

CONTEXT:
${contextStr}

REQUIRED IMPROVEMENTS:
${improvements.join('\n')}

KEY POINTS TO MAINTAIN:
${keyPoints.join('\n')}

LENGTH: ${estimatedLength}

Begin improved content:`;

      const content = await this.createMessage(prompt, 0.3);

      // Evaluate improved content
      const evaluationPrompt = `Evaluate this content on a scale of 1-100:
${content}

Return only a number.`;

      const strengthResponse = await this.createMessage(evaluationPrompt, 0);
      const strength = parseInt(strengthResponse) || 0;

      return { content, strength };
    } catch (error) {
      console.error('Error improving section:', error);
      throw error;
    }
  }

  private async generateInitialPresentationOutline(title: string, topic: string): Promise<string> {
    return this.createMessage(`Create a presentation outline for:
Title: ${title}
Topic: ${topic}

Return a structured outline with sections and key points.`);
  }

  private async generateGenericPlan(query: string): Promise<string> {
    return this.createMessage(`Create a document outline for: ${query}`);
  }

  private formatRelevantContext(context: any[] | undefined): string {
    if (!context || context.length === 0) return '';
    
    return '\nRelevant information from reference documents:\n' + 
      context.map(item => (
        `From ${item.metadata.source_url}:\n${item.content}`
      )).join('\n\n');
  }

  private validateEvaluation(evaluation: EvaluationResult): void {
    const requiredCategories = [
      'readability',
      'relevance',
      'completeness',
      'factualSupport',
      'persuasiveness',
      'consistency'
    ] as const;

    if (typeof evaluation.overallScore !== 'number' || 
        !Array.isArray(evaluation.improvements) ||
        typeof evaluation.detailedFeedback !== 'string') {
      throw new Error('Invalid evaluation structure');
    }

    for (const category of requiredCategories) {
      const score = evaluation.categories[category];
      if (typeof score !== 'number' || score < 1 || score > 100) {
        throw new Error(`Invalid score for category: ${category}`);
      }
    }
  }
}