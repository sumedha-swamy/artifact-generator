import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/factory';
import { AI_PROVIDER, AI_API_KEY } from '@/lib/config';
import { SectionGenerationRequest } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const {
      documentTitle,
      documentPurpose,
      sectionTitle,
      sectionDescription,
      otherSections,
      selectedSources,
      sourceOption,
      keyPoints,
      improvements,
      isImprovement,
      previousContent,
      documentSettings = { defaultTemperature: 0.7, defaultLength: 'medium' }
    } = await request.json();

    // Get relevant context from documents
    let relevantContext = [];
    if (sourceOption === 'all' || (sourceOption === 'selected' && selectedSources?.length > 0)) {
      const queryResponse = await fetch('http://localhost:8000/api/query-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: sectionDescription,
          content: keyPoints.join('\n'),
          selectedSources: sourceOption === 'selected' ? selectedSources : undefined
        })
      });

      const queryData = await queryResponse.json();
      relevantContext = queryData.results || [];
    }

    const provider = AIProviderFactory.createProvider(AI_PROVIDER, {
      apiKey: AI_API_KEY,
    });

    // Find previous and next sections from otherSections
    const currentIndex = otherSections.findIndex((s: { title: string }) => s.title === sectionTitle);
    const previousSection = currentIndex > 0 ? otherSections[currentIndex - 1] : undefined;
    const nextSection = currentIndex < otherSections.length - 1 ? otherSections[currentIndex + 1] : undefined;

    const sectionRequest: SectionGenerationRequest = {
      sectionTitle,
      sectionDescription,
      objective: documentPurpose,
      keyPoints,
      estimatedLength: documentSettings.defaultLength,
      temperature: documentSettings.defaultTemperature,
      documentType: 'Generic',
      previousSection: previousSection ? {
        title: previousSection.title,
        content: previousSection.content
      } : undefined,
      nextSection: nextSection ? {
        title: nextSection.title,
        content: nextSection.content
      } : undefined,
      relevantContext
    };

    const result = isImprovement 
      ? await provider.improveSection(
          previousContent,
          sectionTitle,
          sectionDescription,
          improvements,
          keyPoints,
          documentSettings?.defaultLength || 'medium',
          relevantContext
        )
      : await provider.generateSection(sectionRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in section generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate section' },
      { status: 500 }
    );
  }
} 