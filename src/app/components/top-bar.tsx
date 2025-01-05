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
  onGenerateSections: () => void;
  onGenerateAllContent: () => void;
  isGenerating: boolean;
  sections: Section[];
  isGeneratingAll: boolean;
  documentSettings?: {
    defaultLength: string;
    defaultTemperature: number;
  };
  onSettingsChange: (updates: Partial<{ defaultLength: string; defaultTemperature: number }>) => void;
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
  documentSettings,
  onSettingsChange,
}) => {
  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
  };

  const handlePurposeChange = (newPurpose: string) => {
    onPurposeChange(newPurpose);
  };

  const handleGenerateSectionsClick = async () => {
    try {
      onGenerateSections();
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
    <div className="flex flex-col gap-4 p-4 bg-white border-b">
      <div className="max-w-7xl mx-auto w-full">
        {/* Title Row with Utility Buttons */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-grow px-4 py-2.5 text-lg font-medium text-gray-800 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter document title..."
          />
          <div className="flex gap-3 ml-4">
            <button 
              onClick={handlePreviewClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <Eye size={16} /> Preview
            </button>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        </div>

        {/* Purpose Input */}
        <textarea
          value={documentPurpose}
          onChange={(e) => handlePurposeChange(e.target.value)}
          placeholder="Describe your document's purpose, audience, and requirements..."
          className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px] mb-4"
          rows={3}
        />

        {/* Generation Controls Box */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            {/* Temperature Control */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">
                Creativity:
              </label>
              <div className="flex items-center gap-2 w-40">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={documentSettings?.defaultTemperature ?? 0.7}
                  onChange={(e) => onSettingsChange({ defaultTemperature: parseFloat(e.target.value) })}
                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-gray-500 w-8">
                  {(documentSettings?.defaultTemperature ?? 0.7).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 ${
                isGenerating ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleGenerateSectionsClick}
              disabled={isGenerating}
            >
              <Wand2 size={14} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Planning...' : 'Plan'}
            </button>
            <button 
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 ${
                isGenerating || isGeneratingAll ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleGenerateAllContent}
              disabled={isGenerating || isGeneratingAll}
            >
              <Wand2 size={14} className={isGeneratingAll ? 'animate-spin' : ''} />
              {isGeneratingAll ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;