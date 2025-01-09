import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { title, purpose, references, dataSources } = await request.json();

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    const plan = await provider.generateInitialPlan(title, purpose, references, dataSources);
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in initial plan generation:', error);
    return NextResponse.json({ error: 'Failed to generate initial plan' }, { status: 500 });
  }
} 