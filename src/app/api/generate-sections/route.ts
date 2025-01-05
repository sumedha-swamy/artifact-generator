import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AIProviderType } from '@/lib/ai/types';

// Load environment variables
const AI_PROVIDER = (process.env.AI_PROVIDER as AIProviderType) || 'openai';
const AI_API_KEY = process.env.OPENAI_API_KEY || '';
const AWS_REGION = process.env.AWS_REGION || '';
const AI_MODEL_ID = process.env.AI_MODEL_ID || 'gpt-4-turbo-preview';

interface GenerateSectionsRequest {
  title: string;
  purpose: string;
  domain?: string;
}

interface GenerateSectionContentRequest {
  documentTitle: string;
  documentPurpose: string;
  sectionTitle: string;
  sectionDescription: string;
  otherSections: Array<{ title: string; content: string; }>;
  selectedSources?: string[];
}

function isGenerateSectionsRequest(payload: unknown): payload is GenerateSectionsRequest {
  const p = payload as GenerateSectionsRequest;
  return (
    typeof p.title === 'string' &&
    typeof p.purpose === 'string' &&
    !('sectionTitle' in p)
  );
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

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Received payload:', payload); // Debug log
    console.log('API Key present:', !!AI_API_KEY); // Debug log
    
    const config = {
      apiKey: AI_API_KEY,
      region: AWS_REGION,
      modelId: AI_MODEL_ID,
    };
    
    // Verify config
    if (!config.apiKey) {
      console.error('Missing API key in configuration');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, config);
    console.log('Provider type:', AI_PROVIDER); // Debug log

    // Log which type of request we think it is
    console.log('Is generate sections request:', isGenerateSectionsRequest(payload));
    console.log('Is generate section content request:', isGenerateSectionContentRequest(payload));

    // Handle generating all sections
    if (isGenerateSectionsRequest(payload)) {
      const { title, purpose, domain } = payload;

      if (!title || !purpose) {
        return NextResponse.json(
          { error: 'Title and purpose are required' },
          { status: 400 }
        );
      }

      try {
        const sections = await provider.generateSections(title, purpose, domain);
        console.log('Generated sections:', sections); // Debug log
        
        if (!Array.isArray(sections)) {
          console.error('Provider returned invalid format:', sections);
          throw new Error('Invalid response format from AI provider');
        }
        
        return NextResponse.json({ sections });
      } catch (error) {
        console.error('Error generating sections:', error);
        throw error;
      }
    }
    
    // Handle generating single section content
    else if (isGenerateSectionContentRequest(payload)) {
      const { documentTitle, documentPurpose, sectionTitle, sectionDescription, otherSections, selectedSources } = payload;
      
      console.log('About to call provider.generateSection with:', {
        documentTitle,
        documentPurpose,
        sectionInfo: {
          sectionTitle,
          sectionDescription,
          otherSections
        },
        selectedSources
      });

      try {
        const result = await provider.generateSection(
          documentTitle,
          documentPurpose,
          {
            sectionTitle,
            sectionDescription,
            otherSections,
            estimatedLength: 'As needed for comprehensive coverage',
            temperature: 0.7
          },
          'general',
          'professional',
          selectedSources
        );
        console.log('Provider response:', result);
        return NextResponse.json(result);
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
    console.error('Error in generate-sections API:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate content',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
