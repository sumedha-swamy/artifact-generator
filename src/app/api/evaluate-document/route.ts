import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    const payload = await request.json();
    const { documentTitle, documentPurpose, sections } = payload;

    const evaluation = await provider.evaluateDocument(
      documentTitle,
      documentPurpose,
      sections
    );

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error in document evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate document' },
      { status: 500 }
    );
  }
} 