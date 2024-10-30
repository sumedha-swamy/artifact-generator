'use client';

import React from 'react';
import { Eye, Settings, Download } from 'lucide-react';

interface TopBarProps {
  documentTitle: string;
  documentPurpose: string;
  onPurposeChange: (purpose: string) => void;
  onTitleChange: (title: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  documentTitle, 
  documentPurpose, 
  onPurposeChange,
  onTitleChange 
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
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            />
            <textarea
              value={purpose}
              onChange={(e) => handlePurposeChange(e.target.value)}
              placeholder="Describe your document's purpose, target audience, and key requirements. Be specific about tone and desired outcomes."
              className="text-gray-600 w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 resize-none"
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50 transition-colors text-gray-600">
            <Eye size={20} /> Preview
          </button>
          <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50 transition-colors text-gray-600">
            <Settings size={20} /> Settings
          </button>
          <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50 transition-colors text-gray-600">
            <Download size={20} /> Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;