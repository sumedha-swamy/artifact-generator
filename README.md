# AI-Powered Document Generator

An intelligent document generation tool built with Next.js that helps create structured documents using AI assistance. The application supports multiple document types, collaborative planning, and context-aware content generation.

## Features

- 🤖 AI-powered document planning and generation
- 📝 Multiple document templates (Marketing, Technical, Research)
- 🔄 Real-time content preview with Markdown support
- 📊 Document evaluation and improvement suggestions
- 📚 Context-aware generation using reference materials
- 🎨 Customizable section management
- 📱 Responsive layout with resizable panels

## Tech Stack

- **Frontend**: Next.js 15.0, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API, AWS Bedrock
- **Backend**: FastAPI (Python)
- **Markdown**: React-Markdown with GFM support
- **UI Components**: Radix UI primitives

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
AI_PROVIDER=openai  # or bedrock
AI_API_KEY=your_api_key
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.