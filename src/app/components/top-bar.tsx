'use client';

import React, { useState } from 'react';
import { Eye, Settings, Download, Wand2 } from 'lucide-react';

interface TopBarProps {
  documentTitle: string;
  documentPurpose: string;
  onPurposeChange: (purpose: string) => void;
  onTitleChange: (title: string) => void;
  onGenerateSections: (title: string, purpose: string) => void;
  onGenerateAllContent: () => void;
  isGenerating: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  documentTitle, 
  documentPurpose, 
  onPurposeChange,
  onTitleChange,
  onGenerateSections,
  onGenerateAllContent,
  isGenerating
}) => {
  const [title, setTitle] = React.useState(documentTitle);
  const [purpose, setPurpose] = React.useState(documentPurpose);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handlePurposeChange = (newPurpose: string) => {
    setPurpose(newPurpose);
    onPurposeChange(newPurpose);
  };

  const handleGenerateSectionsClick = async () => {
    try {
      onGenerateSections(title, purpose);
    } catch (error) {
      console.error('Error generating sections:', error);
    }
  };

  const handleGenerateAllContent = async () => {
    setIsGeneratingAll(true);
    try {
      await onGenerateAllContent();
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6 max-w-5xl mx-auto">
      {/* Title Row */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 flex-1"
        />
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
            <Eye size={18} /> Preview
          </button>
          <button className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
            <Settings size={18} /> Settings
          </button>
          <button className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Purpose Row */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute -top-2.5 left-4 px-2 bg-white">
            <span className="text-sm text-gray-500 font-medium">
              Document Purpose
            </span>
          </div>
          <textarea
            value={purpose}
            onChange={(e) => handlePurposeChange(e.target.value)}
            placeholder="Describe your document's purpose, target audience, and key requirements. Be specific about tone and desired outcomes."
            className="text-gray-600 w-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-3 resize-none"
            rows={6}
          />
        </div>
        <div className="flex justify-end">
          <button 
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors ${
              isGenerating ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            onClick={handleGenerateSectionsClick}
            disabled={isGenerating}
          >
            <Wand2 
              size={18} 
              className={isGenerating ? 'animate-spin' : ''} 
            /> 
            {isGenerating ? 'Generating...' : 'Generate Sections'}
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors ml-2 ${
              isGenerating || isGeneratingAll ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            onClick={handleGenerateAllContent}
            disabled={isGenerating || isGeneratingAll}
          >
            <Wand2 
              size={18} 
              className={isGeneratingAll ? 'animate-spin' : ''} 
            /> 
            {isGeneratingAll ? 'Generating All...' : 'Generate All Content'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;