'use client';

import { useEffect, useState, use } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [preview, setPreview] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/preview?id=${id}`);
        if (!response.ok) {
          throw new Error('Preview not found');
        }
        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      }
    };

    fetchPreview();
  }, [id]);

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!preview) {
    return <div className="p-4">Loading preview...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">{preview.title}</h1>
      <div className="prose max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          className="prose-table:table-auto prose-table:w-full prose-td:border prose-td:p-2 prose-th:border prose-th:p-2"
        >
          {preview.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}