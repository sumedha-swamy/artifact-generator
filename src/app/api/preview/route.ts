import { NextResponse } from 'next/server';

// Add this type declaration at the top of the file
declare global {
  var previewData: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Store the data in the session or a temporary storage
    // For this example, we'll use a simple sessionStorage approach
    const previewId = Date.now().toString();
    // You might want to use a proper database or cache system in production
    global.previewData = global.previewData || {};
    global.previewData[previewId] = data;

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