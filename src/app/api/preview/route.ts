import { NextResponse } from 'next/server';

declare global {
  var previewData: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const { title, sections } = await request.json();
    
    // Create preview data with section titles and contents
    const previewData = {
      title,
      content: sections
        .map((section: { title: string; content: string }) => 
          `## ${section.title}\n\n${section.content}`
        )
        .filter(Boolean)
        .join('\n\n')
    };

    const previewId = Date.now().toString();
    global.previewData = global.previewData || {};
    global.previewData[previewId] = previewData;

    return NextResponse.json({ previewId });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid preview data' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const previewId = searchParams.get('id');
    
    if (!previewId || !global.previewData?.[previewId]) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    return NextResponse.json(global.previewData[previewId]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
} 