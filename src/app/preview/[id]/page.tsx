'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save } from 'lucide-react';
import { Section } from '@/app/lib/types'


const PreviewPage = () => {
  const params = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Fetching preview data for ID:', params.id);
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/preview?id=${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title);
          
          // Combine all sections into markdown content
          const markdownContent = data.sections
            .map((section: Section) => `## ${section.title}\n\n${section.content}`)
            .join('\n\n');
          setContent(markdownContent);
        } else {
          setError('Failed to load preview');
        }
      } catch (error) {
        setError('Error loading preview');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPreview();
    }
  }, [params.id]);

  const handleSave = () => {
    // Create the full markdown content with title
    const fullContent = `# ${title}\n\n${content}`;
    
    // Create blob and download link
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            Save as Markdown
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <article className="prose prose-slate lg:prose-lg max-w-none bg-white rounded-lg shadow-sm p-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default PreviewPage;