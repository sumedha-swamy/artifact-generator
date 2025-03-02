import { AIProvider, SectionGenerationRequest, SectionGenerationResponse, EvaluationResult } from './types';
import OpenAI from 'openai';
import { Section } from '@/app/lib/types';
import { DocumentService } from '../api/document-service';
import { QueryResult } from '../api/types';

interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

const GPT_MODEL = "gpt-4o";
const O1_MODEL = "o1-mini";


const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  {
    name: "create_prfaq",
    description: "Create a PRFAQ based on user input",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title or headline of the PRFAQ"
        },
        product_description: {
          type: "string",
          description: "Short description of the product or feature"
        },
      },
      required: ["title", "product_description"]
    },
  },
  {
    name: "create_presentation",
    description: "Create a presentation based on user input",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the presentation"
        },
        topic: {
          type: "string",
          description: "What the presentation is about"
        }
      },
      required: ["title", "topic"]
    },
  },
  {
    name: "create_generic_report",
    description: "Create a generic report if user request is neither PRFAQ nor presentation",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The original user query or request"
        }
      },
      required: ["query"]
    },
  },
];

interface PlanningState {
  currentPlan: string;
  isFinalized: boolean;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = GPT_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Title: ${title}\nPurpose: ${purpose}` }
        ],
        tools: FUNCTION_DEFINITIONS.map(fn => ({ type: "function", function: fn })),
        tool_choice: "auto",
      });

      const message = response.choices[0].message;
      
      if (message.tool_calls?.[0]) {
        const toolCall = message.tool_calls[0];
        const parsedArgs = JSON.parse(toolCall.function.arguments);

        switch (toolCall.function.name) {
          case "create_prfaq":
            return {
              type: "prfaq",
              description: parsedArgs.product_description
            };
          case "create_presentation":
            return {
              type: "presentation",
              topic: parsedArgs.topic
            };
          case "create_generic_report":
            return {
              type: "generic",
              query: parsedArgs.query
            };
          default:
            throw new Error(`Unknown function call: ${toolCall.function.name}`);
        }
      }

      throw new Error("No function call received from the model");
    } catch (error) {
      console.error('Error in agent orchestrator:', error);
      throw error;
    }
  }

  public async generatePlan(title: string, purpose: string, references: string[] = [], dataSources: string[] = []): Promise<string> {
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
    // Get relevant context first
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
      // Continue without context if there's an error
    }

    const contextStr = this.formatRelevantContext(relevantContext);
    const instructions = `You are an expert at creating detailed PRFAQ outlines and plans. 
Your task is to create a PLANNING DOCUMENT (not the final content) for a PRFAQ about:
Title: '${title}'
Description: '${productDescription}'

IMPORTANT: DO NOT GENERATE ANY ACTUAL CONTENT. Instead, for each section:
1. Describe in detail what should be included
2. List key elements to be addressed
3. Provide specific guidelines for content generation
4. Include a list of key points that should be addressed in the content. The key points must focus on the content of the document.
5. Note any special considerations

For example, instead of writing an actual executive quote, write something like this:
"Executive Quote Section:
- Should emphasize the strategic importance of [specific aspect]
- Should be 1-2 sentences long
- Should focus on the product's benefits and value proposition
- Include perspective on market impact
- Reference key differentiators: [list relevant points]
- Tone should be confident yet approachable"

Available resources:
References: ${JSON.stringify(references, null, 2)}
Data sources: ${JSON.stringify(dataSources, null, 2)}

CONTEXT:
${contextStr}

Your outline should follow this structure:
<outline_structure>
## Press Release (PR)
Note: The Press Release section must be about 1 page long.

1. Headline:
   - Should be attention-grabbing and clear
   - Typically 5-10 words long
   - Example: "Amazon Introduces Alexa, A Revolutionary Voice-Controlled Assistant"

2. Subheading:
   - 15-25 words that expand on the headline
   - Focuses on the primary benefit and target audience
   - Example: "Alexa brings voice-controlled convenience to busy households, making everyday tasks easier for families and individuals"

3. Summary Paragraph:
   - Follows the classic journalistic "Who, What, Where, When, Why" format
   - Typically 3-4 sentences long
   - Includes a brief product description and its primary value proposition

4. Problem Paragraph:
   - Clearly articulates the customer pain point
   - Uses specific examples or scenarios to illustrate the problem
   - Demonstrates a deep understanding of the customer's perspective

5. Solution Paragraph(s):
   - Can be multiple paragraphs if needed
   - Describes the product features in detail
   - Explains how each feature addresses the customer problem
   - Highlights unique selling points and competitive advantages

6. Company Leader Quote:
   - Usually attributed to a high-level executive (e.g., CEO, VP of Product)
   - Reinforces the product's importance to the company's strategy
   - Emphasizes the customer-centric approach

7. Customer Quote:
   - Illustrates how the product solves real-world problems
   - Written from the perspective of the ideal customer
   - Includes specific benefits and outcomes

8. Call to Action:
   - Clear instructions on how to access or purchase the product
   - May include pricing information, availability dates, or sign-up processes

## Frequently Asked Questions (FAQ) - Expanded Details
FAQs have no length restrictions.

### Internal FAQ

1. Consumer Needs and Total Addressable Market (TAM):
   - Detailed market research and analysis
   - Customer segmentation and personas
   - Market size estimates and growth projections
   - Competitive landscape analysis

2. Economics & P&L (Profit and Loss):
   - Projected revenue streams
   - Cost structure (fixed and variable costs)
   - Pricing strategy and rationale
   - Break-even analysis
   - Long-term profitability projections

3. Dependencies:
   - Required technologies or partnerships
   - Regulatory or legal considerations
   - Supply chain or manufacturing requirements
   - Integration with existing products or services

4. Key Performance Indicators (KPIs):
   - Metrics for measuring success
   - Short-term and long-term goals
   - Benchmarks against competitors or industry standards

5. Risk Assessment:
   - Potential obstacles or challenges
   - Mitigation strategies
   - Worst-case scenarios and contingency plans

### External FAQ

- Organized by topic or feature
- Anticipates and addresses customer concerns
- Includes technical specifications when relevant
- Provides clear explanations of complex features
- Addresses potential objections or misconceptions

</outline_structure>

## Best Practices for Creating a PR/FAQ

1. Start with the customer: Always focus on customer needs and benefits.
2. Be specific: Use concrete examples and avoid vague statements.
3. Keep it concise: Aim for clarity and brevity in all sections.
4. Challenge assumptions: Use the document to identify and question key assumptions.
5. Future-proof: Write as if the product has already launched, but consider future implications.


Remember:
- Focus on PLANNING not CONTENT
- Be specific about what each section should address
- Include guidance on tone, style, and approach
- Note any dependencies between sections
- Highlight areas where references/data sources should be incorporated
- Dont get carried away with the URLs and domain names of the references/data sources. Focus on the content of the references/data sources.

Provide your response as a clear, structured outline with detailed planning notes for each section.
`;

    const response = await this.client.chat.completions.create({
      model: O1_MODEL,
      messages: [{ role: "user", content: instructions }],
    });
    return response.choices[0].message.content || "";
  }

  

  public async generatePRFAQSections(sectionInfo: SectionGenerationRequest): Promise<SectionGenerationResponse> {
    try {
      const systemPrompt = `You are a senior technical writer specializing in precise, impactful content. Your writing is:
- Concise and direct
- Rich in specific examples
- Data-driven where relevant
- Free of filler words and redundancy
- Logically structured
- Technically accurate

For FAQs:
- Frame as clear questions with direct answers
- Focus on one key point per FAQ
- Provide specific examples or scenarios
- Include technical details when relevant

For Press Release sections:
- Use active voice
- Lead with impact
- Support claims with specifics
- Maintain professional tone`;

      const contextStr = this.formatRelevantContext(sectionInfo.relevantContext);
      const userPrompt = `Generate content for section "${sectionInfo.sectionTitle}" in a ${sectionInfo.documentType}.

CONTEXT
${contextStr}

EXISTING CONTENT
Existing Content: ${sectionInfo.previousContent ? 'Improve upon this content:\n' + sectionInfo.previousContent : 'No existing content'}

Previous Section: ${sectionInfo.previousSection?.title || 'None'}
${sectionInfo.previousSection?.content ? `${sectionInfo.previousSection.content.slice(-200)}...` : ''}

Next Section: ${sectionInfo.nextSection?.title || 'None'}
${sectionInfo.nextSection?.content ? `${sectionInfo.nextSection.content.slice(0, 200)}...` : ''}

REQUIREMENTS
Purpose: ${sectionInfo.objective}
Key Points:
${sectionInfo.keyPoints?.map(point => `• ${point}`).join('\n')}
Length: ${sectionInfo.estimatedLength}

GUIDELINES
1. Start directly with substance - no introductory phrases
2. Each sentence must add value
3. Use concrete examples and specific data
4. Maintain flow with adjacent sections
5. Focus on key points without deviation
6. Avoid:
   - Generic statements
   - Redundant transitions
   - Marketing fluff
   - Obvious statements
   - Passive voice

Begin content:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: sectionInfo.temperature ?? 0.7,
      });

      const content = response.choices[0].message.content || "";
      
      return {
        content,
        strength: 100 // TODO: Implement real evaluation
      };
    } catch (error) {
      console.error('Error generating section:', error);
      throw error;
    }
  }

  private async generatePresentationPlan(title: string, topic: string): Promise<Section[]> {
    // Implement presentation-specific section generation
    // Return array of Section objects
    return [];
  }

  private async generateGenericPlan(query: string): Promise<string> {
    return `# Document Outline for: ${query}`;
  }

  private formatRelevantContext(context: any[] | undefined): string {
    if (!context || context.length === 0) return '';
    
    return '\nRelevant information from reference documents:\n' + 
      context.map(item => (
        `From ${item.metadata.source_url}:\n${item.content}`
      )).join('\n\n');
  }

  public async generateSection(request: SectionGenerationRequest): Promise<SectionGenerationResponse> {
    try {
      const systemPrompt = `You are a senior technical writer specializing in precise, impactful content. Your writing is:
- Concise and direct
- Rich in specific examples
- Data-driven where relevant
- Free of filler words and redundancy
- Logically structured
- Technically accurate

For FAQs:
- Frame as clear questions with direct answers
- Focus on one key point per FAQ
- Provide specific examples or scenarios
- Include technical details when relevant

For Press Release sections:
- Use active voice
- Lead with impact
- Support claims with specifics
- Maintain professional tone`;

    const contextStr = this.formatRelevantContext(request.relevantContext);      
    const userPrompt = `Generate content for section "${request.sectionTitle}".

CONTEXT
${contextStr}

EXISTING CONTENT
Existing Content: ${request.previousContent ? 'Improve upon this content:\n' + request.previousContent : 'No existing content'}

Previous Section: ${request.previousSection?.title || 'None'}
${request.previousSection?.content ? `${request.previousSection.content.slice(-200)}...` : ''}

Next Section: ${request.nextSection?.title || 'None'}
${request.nextSection?.content ? `${request.nextSection.content.slice(0, 200)}...` : ''}

REQUIREMENTS
Purpose: ${request.objective}
Key Points:
${request.keyPoints?.map(point => `• ${point}`).join('\n')}
Length: ${request.estimatedLength}

GUIDELINES
1. Start directly with substance - no introductory phrases
2. Each sentence must add value
3. Use concrete examples and specific data
4. Maintain flow with adjacent sections
5. Focus on key points without deviation
6. Avoid:
   - Generic statements
   - Redundant transitions
   - Marketing fluff
   - Obvious statements
   - Passive voice

Begin content:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: request.temperature ?? 0.7,
      });

      const content = response.choices[0].message.content || "";

      // Enhanced evaluation prompt focusing on flow and integration
      const evaluationPrompt = `You are an expert content evaluator. Evaluate the given content on a scale of 1-100 based on:
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
            content: `Evaluate this content for the section "${request.sectionTitle}":

${content}`
          }
        ],
        temperature: 0,
      });

      const strength = parseInt(evaluationResponse.choices[0].message.content || "0");
      
      return {
        content,
        strength
      };

    } catch (error) {
      console.error('Error generating section:', error);
      throw error;
    }
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

  public async refinePlan(previousPlan: string, userFeedback: string): Promise<string> {
    const refinementInstructions = `We have this current outline/plan:
${previousPlan}

User feedback:
${userFeedback}

Please refine the plan accordingly.
Return only the updated plan as plain text.
Do NOT return final JSON yet.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "system", content: refinementInstructions }],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  }

  public async finalizePlanToJson(finalPlan: string): Promise<Section[]> {
    const systemInstructions = `We have a finalized PRFAQ plan (outline) in plain text:

${finalPlan}

Convert this plan into a JSON array of sections. Each section should have these fields:
- title (string)
- description (string)
- objective (string)
- key_points (string[])
- estimated_length (string)
- target_audience (string)

IMPORTANT:
1. Return ONLY the raw JSON - no markdown formatting, no \`\`\` blocks
2. The JSON should be an object with a "sections" array
3. Make the description thorough enough for an LLM to generate content later
4. Key points should be specific and detailed enough about the content for an LLM to generate content later. Key points must not exclusively focus on the structure of the document. The main focus should be on the content of the document.
5. Ensure the JSON is valid and properly formatted

Example format:
{
  "sections": [
    {
      "title": "Section Title",
      "description": "Detailed description...",
      "objective": "Section objective...",
      "key_points": ["point 1", "point 2"],
      "estimated_length": "2 paragraphs",
      "target_audience": "Technical users"
    }
  ]
}

Use the following document structure and best practices for reference as you generate elaborate and detailed descriptions for each section. The sections must be clearly defined and detailed enough for an LLM to use it as a prompt to generate content later:
The general structure of the document should be as follows:
<document_structure>
The PR/FAQ format is described below.

## Press Release (PR)
Note: The Press Release section must be about 1 page long. 

1. Headline:
   - Should be attention-grabbing and clear
   - Typically 5-10 words long
   - Example: "Amazon Introduces Alexa, A Revolutionary Voice-Controlled Assistant"

2. Subheading:
   - 15-25 words that expand on the headline
   - Focuses on the primary benefit and target audience
   - Example: "Alexa brings voice-controlled convenience to busy households, making everyday tasks easier for families and individuals"

3. Summary Paragraph:
   - Follows the classic journalistic "Who, What, Where, When, Why" format
   - Typically 3-4 sentences long
   - Includes a brief product description and its primary value proposition

4. Problem Paragraph:
   - Clearly articulates the customer pain point
   - Uses specific examples or scenarios to illustrate the problem
   - Demonstrates a deep understanding of the customer's perspective

5. Solution Paragraph(s):
   - Can be multiple paragraphs if needed
   - Describes the product features in detail
   - Explains how each feature addresses the customer problem
   - Highlights unique selling points and competitive advantages

6. Company Leader Quote:
   - Usually attributed to a high-level executive (e.g., CEO, VP of Product)
   - Reinforces the product's importance to the company's strategy
   - Emphasizes the customer-centric approach

7. Customer Quote:
   - Illustrates how the product solves real-world problems
   - Written from the perspective of the ideal customer
   - Includes specific benefits and outcomes

8. Call to Action:
   - Clear instructions on how to access or purchase the product
   - May include pricing information, availability dates, or sign-up processes


## Frequently Asked Questions (FAQ)
Note: The FAQ section must be after the PR section and FAQs have no length restrictions.
FAQs should be framed in the form of questions. The description for the question should be elaborate and detailed enough for an LLM to generate content later.
Each question should be numbered.
Add sections named "Internal FAQs" and "External FAQs" before those sections. The content for these sections must just be the title of the section. 


### Internal FAQ

1. Consumer Needs and Total Addressable Market (TAM):
   - Detailed market research and analysis
   - Customer segmentation and personas
   - Market size estimates and growth projections
   - Competitive landscape analysis

2. Economics & P&L (Profit and Loss):
   - Projected revenue streams
   - Cost structure (fixed and variable costs)
   - Pricing strategy and rationale
   - Break-even analysis
   - Long-term profitability projections

3. Dependencies:
   - Required technologies or partnerships
   - Regulatory or legal considerations
   - Supply chain or manufacturing requirements
   - Integration with existing products or services

4. Key Performance Indicators (KPIs):
   - Metrics for measuring success
   - Short-term and long-term goals
   - Benchmarks against competitors or industry standards

5. Risk Assessment:
   - Potential obstacles or challenges
   - Mitigation strategies
   - Worst-case scenarios and contingency plans

### External FAQ

- Organized by topic or feature
- Anticipates and addresses customer concerns
- Includes technical specifications when relevant
- Provides clear explanations of complex features
- Addresses potential objections or misconceptions


</document_structure>

<best_practices>
## Best Practices for Creating a PR/FAQ

1. Start with the customer: Always focus on customer needs and benefits.
2. Be specific: Use concrete examples and avoid vague statements.
3. Keep it concise: Aim for clarity and brevity in all sections.
4. Iterate: Refine the document based on feedback and new insights.
5. Challenge assumptions: Use the document to identify and question key assumptions.
6. Collaborate: Involve cross-functional teams in the creation process.
7. Future-proof: Write as if the product has already launched, but consider future implications.
</best_practices>

`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "system", content: systemInstructions }],
      temperature: 0.7,
    });

    try {
      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from OpenAI');

      // Clean the response: remove any markdown formatting
      const cleanedContent = content
        .replace(/```json\n?/g, '')  // Remove ```json
        .replace(/```\n?/g, '')      // Remove closing ```
        .trim();                     // Remove extra whitespace

      const result = JSON.parse(cleanedContent);
      
      if (!result.sections || !Array.isArray(result.sections)) {
        throw new Error('Invalid JSON structure: missing sections array');
      }

      return result.sections.map((section: any) => ({
        id: crypto.randomUUID(),  // Add an ID for each section
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error parsing finalized plan:', error);
      console.error('Raw content:', response.choices[0].message.content);
      throw new Error(`Failed to parse plan: ${error.message}`);
    }
  }

  private async generateInitialPresentationOutline(title: string, topic: string): Promise<string> {
    return `# Presentation Outline for: ${title}\n## Topic: ${topic}`;
  }

  private async generateInitialGenericOutline(query: string): Promise<string> {
    // TODO: Implement generic outline generation
    return `# Document Outline for: ${query}`;
  }

  public async evaluateDocument(
    title: string,
    purpose: string,
    sections: Array<Section>
  ): Promise<EvaluationResult> {
    const systemPrompt = `You are an expert document evaluator tasked with providing a comprehensive assessment of documents. Your evaluation should be thorough, objective, and actionable.

Evaluation Criteria (Score Range: 1-100):

1. Readability (Weight: 20%)
   - Assess: Clarity, sentence structure, vocabulary level, and logical flow
   - Consider: Headers, transitions, and paragraph organization
   - Evaluate: Grammar, punctuation, and formatting consistency

2. Relevance (Weight: 25%)
   - Assess: Alignment with stated document purpose
   - Evaluate: Each section's contribution to the overall goal
   - Consider: Target audience appropriateness

3. Completeness (Weight: 20%)
   - Verify: All required sections are present
   - Assess: Depth of coverage for each topic
   - Check: No critical information gaps

4. Factual Support (Weight: 15%)
   - Evaluate: Use of evidence, data, and examples
   - Check: Citation quality and reliability
   - Assess: Balance of facts vs. assertions

5. Persuasiveness (Weight: 10%)
   - Analyze: Argument structure and logic
   - Evaluate: Use of rhetorical techniques
   - Consider: Emotional appeal and credibility

6. Consistency (Weight: 10%)
   - Check: Terminology usage across sections
   - Assess: Style and tone uniformity
   - Verify: No contradictions between sections

Instructions:
1. Evaluate each section against the description provided
2. Consider relationships between sections
3. Provide specific, actionable improvement suggestions
4. Support all feedback with concrete examples from the text

Remember to maintain objectivity and provide constructive criticism that can be implemented to improve the document.`;

    const userPrompt = `Evaluate this document:

TITLE: ${title}
PURPOSE: ${purpose}

SECTIONS:
${sections.map(s => `
[Section]: ${s.title}
[Required Content]: ${s.description}
[Key Points]: ${s.keyPoints ? '\n' + s.keyPoints.map(point => `• ${point}`).join('\n') : 'None specified'}
[Actual Content]: ${s.content}
---`).join('\n')}

For each section, evaluate:
1. How well the content addresses each key point listed
2. Whether any key points were missed or inadequately covered
3. The balance between key points coverage

Evaluate strictly according to the criteria provided. Return only a JSON object matching this exact structure:
{
  "overallScore": <weighted average based on specified weights>,
  "categories": {
    "readability": <score>,
    "relevance": <score>,
    "completeness": <score>,
    "factualSupport": <score>,
    "persuasiveness": <score>,
    "consistency": <score>
  },
  "improvements": [
    "<specific, actionable improvement suggestion>",
    ...
  ],
  "detailedFeedback": "<comprehensive analysis including key points coverage assessment>"
}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No evaluation received from AI');
    }

    try {
      const evaluation = JSON.parse(content) as EvaluationResult;
      this.validateEvaluation(evaluation);
      return evaluation;
    } catch (error) {
      console.error('Failed to parse evaluation:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to process evaluation response');
    }
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

    // Validate structure
    if (typeof evaluation.overallScore !== 'number' || 
        !Array.isArray(evaluation.improvements) ||
        typeof evaluation.detailedFeedback !== 'string') {
      throw new Error('Invalid evaluation structure');
    }

    // Validate categories
    for (const category of requiredCategories) {
      const score = evaluation.categories[category as keyof typeof evaluation.categories];
      if (typeof score !== 'number' || score < 1 || score > 100) {
        throw new Error(`Invalid score for category: ${category}`);
      }
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

      const systemPrompt = `You are a senior technical writer focusing on improving specific sections of a document. Your task is to enhance the given section while:
      - Maintaining its original purpose and scope
      - Addressing only relevant improvements
      - Keeping the section's role in the larger document
      - Adhering to specified length requirements`;

      const contextStr = this.formatRelevantContext(relevantContext);
      const userPrompt = `Improve the following content for section "${sectionTitle}":

CONTEXT:
${contextStr}

EXISTING CONTENT:
${currentContent || 'No existing content'}

SECTION DESCRIPTION:
${sectionDescription || 'No description provided'}

LENGTH REQUIREMENT: ${estimatedLength}

KEY POINTS TO MAINTAIN:
${keyPoints?.map(point => `• ${point}`).join('\n') || 'No key points specified'}

REQUIRED IMPROVEMENTS:
${improvements.map(imp => `• ${imp}`).join('\n')}

GUIDELINES:
1. Strictly adhere to the specified length requirement (${estimatedLength})
2. Maintain the original purpose while implementing improvements
3. Ensure all key points are still covered
4. Keep the content focused and well-structured
5. Preserve technical accuracy
6. Improve clarity and impact
7. Address each improvement point specifically
8. If you are not sure about the improvements, just return the current content

Begin improved content:`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent improvements
      });

      const content = response.choices[0].message.content || "";

      // Use the same evaluation logic as generateSection
      const evaluationPrompt = `You are an expert content evaluator. Evaluate the given content on a scale of 1-100 based on:
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
            content: `Evaluate this improved content:\n\n${content}`
          }
        ],
        temperature: 0,
      });

      const strength = parseInt(evaluationResponse.choices[0].message.content || "0");
      
      return {
        content,
        strength
      };

    } catch (error) {
      console.error('Error improving section:', error);
      throw error;
    }
  }
}
