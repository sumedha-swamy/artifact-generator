import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AIProviderType, SectionGenerationRequest } from '@/lib/ai/types';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';



interface GenerateSectionContentRequest {
  documentTitle: string;
  documentPurpose: string;
  sectionTitle: string;
  sectionDescription: string;
  otherSections: Array<{ title: string; content: string; }>;
  selectedSources?: string[];
  temperature?: number;
  estimatedLength?: string;
  keyPoints?: string[];
}

interface GeneratePlanRequest {
  title: string;
  purpose: string;
}


function isGenerateSectionContentRequest(payload: unknown): payload is GenerateSectionContentRequest {
  const p = payload as GenerateSectionContentRequest;
  return (
    typeof p.documentTitle === 'string' &&
    typeof p.documentPurpose === 'string' &&
    typeof p.sectionTitle === 'string' &&
    typeof p.sectionDescription === 'string' &&
    Array.isArray(p.otherSections) &&
    (!p.selectedSources || Array.isArray(p.selectedSources))
  );
}

function isGeneratePlanRequest(payload: unknown): payload is GeneratePlanRequest {
  const p = payload as GeneratePlanRequest;
  return (
    typeof p.title === 'string' &&
    typeof p.purpose === 'string'
  );
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      title,
      purpose,
      selectedSources,
      references = [],
      dataSources = []
    } = payload;

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    // If it's a PRFAQ, use the specialized method
    const documentType = await provider.runAgentOrchestrator(title, purpose);
    if (documentType.type === "prfaq") {
      const plan = await provider.generatePRFAQPlan(
        title,
        documentType.description ?? purpose,
        selectedSources,
        references,
        dataSources
      );
      return NextResponse.json({ plan });
    }

    // Handle generating plan
    if (isGeneratePlanRequest(payload)) {
      const { title, purpose } = payload;

      if (!title || !purpose) {
        return NextResponse.json(
          { error: 'Title and purpose are required' },
          { status: 400 }
        );
      }

      try {
        const sections = await provider.generatePlan(title, purpose);

        if (!Array.isArray(sections)) {
          console.error('Provider returned invalid format:', sections);
          throw new Error('Invalid response format from AI provider');
        }
        
        return NextResponse.json({ sections });
      } catch (error) {
        console.error('Error generating plan:', error);
        throw error;
      }
    }
    // Handle generating single section content
    else if (isGenerateSectionContentRequest(payload)) {
      const { documentTitle, documentPurpose, sectionTitle, sectionDescription, otherSections, selectedSources, temperature, estimatedLength, keyPoints } = payload;

      try {
        const sectionRequest: SectionGenerationRequest = {
          sectionTitle,
          sectionDescription,
          objective: documentPurpose,
          keyPoints,
          estimatedLength: estimatedLength || 'As needed for comprehensive coverage',
          temperature: Number(temperature ?? 0.7),
          documentType: 'Generic'
        };

        const content = await provider.generateSection(sectionRequest);
        return NextResponse.json(content);
      } catch (error) {
        console.error('Error from provider:', error);
        throw error;
      }
    }
    
    // Handle invalid request
    else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in generate-plan API:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
