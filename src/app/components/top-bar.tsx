'use client';

import React, { useState } from 'react';
import { Eye, Settings, Download, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Section } from '@/app/lib/types';

interface TopBarProps {
  documentTitle: string;
  documentPurpose: string;
  onPurposeChange: (purpose: string) => void;
  onTitleChange: (title: string) => void;
  onGenerateSections: (title: string, purpose: string) => void;
  onGenerateAllContent: () => void;
  isGenerating: boolean;
  sections: Section[];
  isGeneratingAll: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  documentTitle, 
  documentPurpose, 
  onPurposeChange,
  onTitleChange,
  onGenerateSections,
  onGenerateAllContent,
  isGenerating,
  sections,
  isGeneratingAll,
}) => {
  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
  };

  const handlePurposeChange = (newPurpose: string) => {
    onPurposeChange(newPurpose);
  };

  const handleGenerateSectionsClick = async () => {
    try {
      onGenerateSections(documentTitle, documentPurpose);
    } catch (error) {
      console.error('Error generating sections:', error);
    }
  };

  const handleGenerateAllContent = async () => {
    try {
      onGenerateAllContent();
    } catch (error) {
      console.error('Error generating all content:', error);
    }
  };

  const handlePreviewClick = async () => {
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          sections
        }),
      });

      if (response.ok) {
        const { previewId } = await response.json();
        window.open(`/preview/${previewId}`, '_blank');
      }
    } catch (error) {
      console.error('Error creating preview:', error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 w-full">
      <div className="max-w-7xl mx-auto">
        {/* Title Row with Utility Buttons */}
        <div className="flex items-center justify-between mb-3">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="flex-grow px-3 py-2 text-lg font-medium text-gray-800 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter document title..."
          />
          <div className="flex gap-2 ml-4">
            <button 
              onClick={handlePreviewClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Eye size={16} /> Preview
            </button>
            <button 
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        </div>

        {/* Description and Action Buttons Row */}
        <div className="flex gap-3">
          <textarea
            value={documentPurpose}
            onChange={(e) => handlePurposeChange(e.target.value)}
            placeholder="Describe your document's purpose, audience, and requirements..."
            className="flex-grow px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={2}
          />
          <div className="flex flex-col gap-2">
            <button 
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 whitespace-nowrap ${
                isGenerating ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleGenerateSectionsClick}
              disabled={isGenerating}
            >
              <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Planning...' : 'Plan'}
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 whitespace-nowrap ${
                isGenerating || isGeneratingAll ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleGenerateAllContent}
              disabled={isGenerating || isGeneratingAll}
            >
              <Wand2 size={16} className={isGeneratingAll ? 'animate-spin' : ''} />
              {isGeneratingAll ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;