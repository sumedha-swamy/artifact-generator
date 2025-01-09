import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { currentPlan, feedback } = await request.json();

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    const refinedPlan = await provider.refinePlan(currentPlan, feedback);
    
    return NextResponse.json({ plan: refinedPlan });
  } catch (error) {
    console.error('Error in plan refinement:', error);
    return NextResponse.json({ error: 'Failed to refine plan' }, { status: 500 });
  }
} 