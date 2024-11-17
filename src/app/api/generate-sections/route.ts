import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AIProviderType } from '@/lib/ai/types';

// Load environment variables
const AI_PROVIDER = process.env.AI_PROVIDER as AIProviderType || 'openai';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AWS_REGION = process.env.AWS_REGION || '';
const AI_MODEL_ID = process.env.AI_MODEL_ID || 'gpt-4-turbo-preview';

interface GenerateSectionsRequest {
  title: string;
  purpose: string;
}

interface GenerateSectionContentRequest {
  documentTitle: string;
  documentPurpose: string;
  sectionTitle: string;
  sectionDescription: string;
  otherSections: Array<{ title: string; content: string; }>;
}

function isGenerateSectionsRequest(payload: any): payload is GenerateSectionsRequest {
  return (
    typeof payload.title === 'string' &&
    typeof payload.purpose === 'string' &&
    !('sectionTitle' in payload)
  );
}

function isGenerateSectionContentRequest(payload: any): payload is GenerateSectionContentRequest {
  return (
    typeof payload.documentTitle === 'string' &&
    typeof payload.documentPurpose === 'string' &&
    typeof payload.sectionTitle === 'string' &&
    typeof payload.sectionDescription === 'string' &&
    Array.isArray(payload.otherSections)
  );
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const config = {
      apiKey: AI_API_KEY,
      region: AWS_REGION,
      modelId: AI_MODEL_ID,
    };
    const provider = AIProviderFactory.createProvider(AI_PROVIDER, config);

    // Handle generating all sections
    if (isGenerateSectionsRequest(payload)) {
      const { title, purpose } = payload;
      
      if (!title || !purpose) {
        return NextResponse.json(
          { error: 'Title and purpose are required' },
          { status: 400 }
        );
      }

      const sections = await provider.generateSections(title, purpose);
      return NextResponse.json({ sections });
    }
    
    // Handle generating single section content
    else if (isGenerateSectionContentRequest(payload)) {
      const { 
        documentTitle, 
        documentPurpose, 
        sectionTitle, 
        sectionDescription, 
        otherSections 
      } = payload;

      if (!documentTitle || !documentPurpose || !sectionTitle || !sectionDescription) {
        return NextResponse.json(
          { error: 'Missing required parameters for section generation' },
          { status: 400 }
        );
      }

      const result = await provider.generateSection(
        documentTitle,
        documentPurpose,
        {
          sectionTitle,
          sectionDescription,
          otherSections
        }
      );

      return NextResponse.json(result);
    }
    
    // Handle invalid request
    else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in generate-sections API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
