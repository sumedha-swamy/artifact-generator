'use client';

import React from 'react';
import { Plus, FileText, Link, Image, Music, Video, Layout } from 'lucide-react';

interface Source {
  id: number;
  type: string;
  name: string;
  icon: any; // Using any for now, but ideally should use LucideIcon
}

interface ContextSourcesSidebarProps {
  onTemplateClick: () => void;
}

const ContextSourcesSidebar: React.FC<ContextSourcesSidebarProps> = ({ onTemplateClick }) => {
  const sources = [
    { id: 1, type: 'document', name: 'Document1.pdf', icon: FileText },
    { id: 2, type: 'link', name: 'Website Link', icon: Link },
    { id: 3, type: 'image', name: 'Image1.png', icon: Image },
    { id: 4, type: 'video', name: 'Video1.mp4', icon: Video },
    { id: 5, type: 'audio', name: 'Audio1.mp3', icon: Music }
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, source: Source) => {
    e.dataTransfer.setData('application/json', JSON.stringify(source));
  };

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Context Sources</h2>
        <div className="space-y-2">
          <button className="w-full bg-blue-600 text-white rounded-lg p-2 flex items-center 
                           justify-center gap-2 hover:bg-blue-700 transition-colors">
            <Plus size={20} /> Add Source
          </button>
          <button 
            className="w-full border border-gray-200 text-gray-700 rounded-lg p-2 
                     flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            onClick={onTemplateClick}
          >
            <Layout size={20} /> Use Template
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500 px-2">
          <span>Sources</span>
          <span>{sources.length} items</span>
        </div>
        
        <div className="space-y-1">
          {sources.map(source => (
            <div
              key={source.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-move group text-gray-600"
              draggable
              onDragStart={(e) => handleDragStart(e, source)}
            >
              <source.icon size={20} className="text-gray-600" />
              <span className="flex-1 truncate">{source.name}</span>
              <div className="hidden group-hover:flex items-center gap-1">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <FileText size={14} className="text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Link size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 text-gray-600">
            <Plus size={16} />
            New Folder
          </button>
          <button className="p-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 text-gray-600">
            <Link size={16} />
            Add URL
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Need Help?</h3>
          <p className="text-sm text-blue-600">
            Drop files here or click Add Source to upload your context materials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextSourcesSidebar;