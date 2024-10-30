import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AIProviderType } from '@/lib/ai/types';

// Load environment variables
const AI_PROVIDER = process.env.AI_PROVIDER as AIProviderType || 'openai';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AWS_REGION = process.env.AWS_REGION || '';
const AI_MODEL_ID = process.env.AI_MODEL_ID || '';

export async function POST(request: Request) {
  try {
    const { title, purpose } = await request.json();

    if (!title || !purpose) {
      return NextResponse.json(
        { error: 'Title and purpose are required' },
        { status: 400 }
      );
    }

    const config = {
      apiKey: AI_API_KEY,
      region: AWS_REGION,
      modelId: AI_MODEL_ID,
    };

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, config);
    const sections = await provider.generateSections(title, purpose);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error in generate-sections API:', error);
    return NextResponse.json(
      { error: 'Failed to generate sections' },
      { status: 500 }
    );
  }
}
