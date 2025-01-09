import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { finalPlan } = await request.json();

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    const sections = await provider.finalizePlanToJson(finalPlan);
    
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error in plan finalization:', error);
    return NextResponse.json({ error: 'Failed to finalize plan' }, { status: 500 });
  }
} 