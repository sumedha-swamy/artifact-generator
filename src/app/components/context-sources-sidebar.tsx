'use client';

import React, { useState } from 'react';
import { Plus, FileText, Link, Trash, ChevronDown } from 'lucide-react';

interface Source {
  id: number;
  name: string;
  path: string;
  selected?: boolean;
}

interface ContextSourcesSidebarProps {
  onTemplateClick: () => void;
  onSelectResources: (selectedResources: Source[]) => void;
}

const ContextSourcesSidebar: React.FC<ContextSourcesSidebarProps> = ({ onSelectResources }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const newSource = {
        id: Date.now(),
        name: files[0].name,
        path: URL.createObjectURL(files[0])
      };
      setSources([...sources, newSource]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newSource = {
        id: Date.now(),
        name: files[0].name,
        path: URL.createObjectURL(files[0])
      };
      setSources([...sources, newSource]);
    }
  };

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      const newSource = {
        id: Date.now(),
        name: urlInput,
        path: urlInput
      };
      setSources([...sources, newSource]);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleDelete = (id: number) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const handleResourceSelect = (selectedId: number) => {
    const updatedSources = sources.map(source => 
      source.id === selectedId ? { ...source, selected: !source.selected } : source
    );
    setSources(updatedSources);
    onSelectResources(updatedSources.filter(source => source.selected));
  };

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-300 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Resources</h2>
        <div className="space-y-2">
          <div className="flex">
            <label className="flex-grow bg-blue-600 text-white rounded-l-lg p-2 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer">
              <Plus size={20} /> Add Resource
              <input type="file" className="hidden" onChange={handleFileSelect} />
            </label>
            <button
              className="bg-blue-600 text-white rounded-r-lg p-2 flex items-center justify-center hover:bg-blue-700 transition-colors"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          {showUrlInput && (
            <div className="mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL"
                className="w-full p-2 border-b border-gray-300"
              />
              <button
                onClick={handleAddUrl}
                className="w-full bg-blue-600 text-white rounded-b-lg p-2 hover:bg-blue-700 transition-colors"
              >
                Add URL
              </button>
            </div>
          )}
          <label
            htmlFor="fileInput"
            className={`block mt-4 p-4 bg-blue-50 rounded-lg cursor-pointer ${isDragOver ? 'border-2 border-blue-500' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <h3 className="text-sm font-medium text-blue-700 mb-1">Add Resources</h3>
            <p className="text-sm text-blue-600">
              Drag and drop files here, or click to browse.
            </p>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500 px-2">
          <span>Resources</span>
          <span>{sources.length} items</span>
        </div>
        
        <div className="space-y-1">
          {sources.map(source => (
            <div
              key={source.id}
              className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer group text-gray-600 ${source.selected ? 'bg-blue-100' : ''}`}
              onClick={() => handleResourceSelect(source.id)}
            >
              <FileText size={20} className="text-gray-600" />
              <span className="flex-1 truncate" title={source.path}>{source.name}</span>
              <div className="hidden group-hover:flex items-center gap-1">
                <button className="p-1 hover:bg-gray-200 rounded" onClick={() => handleDelete(source.id)}>
                  <Trash size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextSourcesSidebar;