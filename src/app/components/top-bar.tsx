'use client';

import React from 'react';
import { Eye, Settings, Download, Wand2 } from 'lucide-react';

interface TopBarProps {
  documentTitle: string;
  documentPurpose: string;
  onPurposeChange: (purpose: string) => void;
  onTitleChange: (title: string) => void;
  onGenerateSections: (title: string, purpose: string) => void;
  isGenerating: boolean; // Add this prop
}

const TopBar: React.FC<TopBarProps> = ({ 
  documentTitle, 
  documentPurpose, 
  onPurposeChange,
  onTitleChange,
  onGenerateSections,
  isGenerating
}) => {
  const [title, setTitle] = React.useState(documentTitle);
  const [purpose, setPurpose] = React.useState(documentPurpose);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handlePurposeChange = (newPurpose: string) => {
    setPurpose(newPurpose);
    onPurposeChange(newPurpose);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
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
      <div className="max-w-4xl">
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
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button 
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors ${
                isGenerating ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
              onClick={() => onGenerateSections(title, purpose)}
              disabled={isGenerating}
            >
              <Wand2 
                size={18} 
                className={isGenerating ? 'animate-spin' : ''} 
              /> 
              {isGenerating ? 'Generating...' : 'Generate Sections'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;