import { AIProvider, SectionGenerationRequest, SectionGenerationResponse, EvaluationResult } from './types';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Section } from '@/app/lib/types';
import { DocumentService } from '../api/document-service';
import crypto from 'crypto';

export class BedrockProvider implements AIProvider {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(region: string, modelId: string = "anthropic.claude-v2") {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  private async invoke(prompt: string, temperature: number = 0.7): Promise<string> {
    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 4096,
        temperature,
        top_p: 0.9,
      }),
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await this.client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.completion;
  }

  public async runAgentOrchestrator(title: string, purpose: string): Promise<{
    type: "prfaq" | "presentation" | "generic";
    description?: string;
    topic?: string;
    query?: string;
  }> {
    try {
      const systemPrompt = `You are an orchestrator. Based on the document title and purpose, determine which type of document to create:
1) PRFAQ - for product/feature announcements
2) Presentation - for slide decks and presentations
3) Generic Report - for other document types`;

      const response = await this.invoke(`${systemPrompt}\n\nTitle: ${title}\nPurpose: ${purpose}\n\nReturn your response in JSON format with type, description, topic, and query fields.`, 0.2);
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
    
    switch (documentType.type) {
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
Do not generate actual content.`;

    return this.invoke(prompt);
  }

  public async refinePlan(previousPlan: string, userFeedback: string): Promise<string> {
    const prompt = `We have this current outline/plan:
${previousPlan}

User feedback:
${userFeedback}

Please refine the plan accordingly.
Return only the updated plan as plain text.`;

    return this.invoke(prompt, 0.7);
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

Return only the raw JSON.`;

    try {
      const response = await this.invoke(prompt, 0.7);
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
      const systemPrompt = `You are a senior technical writer specializing in precise, impactful content.`;
      const contextStr = this.formatRelevantContext(request.relevantContext);
      
      const userPrompt = `Generate content for section "${request.sectionTitle}" in a ${request.documentType}.

CONTEXT:
${contextStr}

REQUIREMENTS:
Purpose: ${request.objective}
Key Points: ${request.keyPoints?.join('\n')}
Length: ${request.estimatedLength}

Begin content:`;

      const content = await this.invoke(`${systemPrompt}\n\n${userPrompt}`, request.temperature ?? 0.7);

      // Evaluate content
      const evaluationPrompt = `Evaluate this content on a scale of 1-100 based on clarity, comprehensiveness, and quality.
Content to evaluate:
${content}

Return only a number.`;

      const strengthResponse = await this.invoke(evaluationPrompt, 0);
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
    const prompt = `Evaluate this document:

TITLE: ${title}
PURPOSE: ${purpose}

SECTIONS:
${sections.map(s => `
[Section]: ${s.title}
[Content]: ${s.content}
---`).join('\n')}

Evaluate and return a JSON object with:
- overallScore (number)
- categories (object with scores for readability, relevance, completeness, factualSupport, persuasiveness, consistency)
- improvements (array of strings)
- detailedFeedback (string)`;

    try {
      const response = await this.invoke(prompt, 0.2);
      const evaluation = JSON.parse(response) as EvaluationResult;
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

      const content = await this.invoke(prompt, 0.3);

      // Evaluate improved content
      const evaluationPrompt = `Evaluate this content on a scale of 1-100:
${content}

Return only a number.`;

      const strengthResponse = await this.invoke(evaluationPrompt, 0);
      const strength = parseInt(strengthResponse) || 0;

      return { content, strength };
    } catch (error) {
      console.error('Error improving section:', error);
      throw error;
    }
  }

  private async generateInitialPresentationOutline(title: string, topic: string): Promise<string> {
    return this.invoke(`Create a presentation outline for:
Title: ${title}
Topic: ${topic}

Return a structured outline with sections and key points.`);
  }

  private async generateGenericPlan(query: string): Promise<string> {
    return this.invoke(`Create a document outline for: ${query}`);
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
