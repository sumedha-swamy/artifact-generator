import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const {
      documentTitle,
      documentPurpose,
      sectionTitle,
      sectionDescription,
      otherSections,
      selectedSources,
      keyPoints,
      improvements,
      isImprovement,
      previousContent,
      documentSettings
    } = await request.json();

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    const result = isImprovement 
      ? await provider.improveSection(previousContent, sectionDescription, improvements, keyPoints)
      : await provider.generateSection(
          JSON.stringify({
            documentTitle,
            documentPurpose,
            sectionTitle,
            sectionDescription,
            otherSections,
            selectedSources,
            keyPoints
          }),
          documentSettings.defaultTemperature,
          documentSettings.defaultLength
        );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in section generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate section' },
      { status: 500 }
    );
  }
} 