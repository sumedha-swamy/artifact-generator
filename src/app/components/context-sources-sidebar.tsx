'use client';

import React, { useState } from 'react';
import { Plus, FileText, Link, Trash, ChevronDown, Loader2 } from 'lucide-react';
import { DocumentService } from '@/lib/api/document-service';
import { AxiosError } from 'axios';

interface Source {
  id: number;
  name: string;
  path: string;
  selected?: boolean;
  status: 'processing' | 'completed' | 'error';
}

interface ContextSourcesSidebarProps {
  onTemplateClick: () => void;
  onSelectResources: (selectedResources: Source[]) => void;
}

const SourceItem = ({ source, onDelete, onSelect }: { 
  source: Source; 
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
}) => {
  return (
    <div
      className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer group ${
        source.selected ? 'bg-blue-50' : ''
      }`}
      onClick={() => onSelect(source.id)}
    >
      <FileText size={20} className="text-gray-600 flex-shrink-0" />
      <span className="flex-1 truncate" title={source.name}>{source.name}</span>
      
      {/* Status indicators */}
      <div className="flex items-center gap-2">
        {source.status === 'processing' && (
          <div className="flex items-center gap-1 text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Processing...</span>
          </div>
        )}
        {source.status === 'error' && (
          <span className="text-xs text-red-600">Failed</span>
        )}
        {source.status === 'completed' && (
          <div className="text-xs text-green-600">Ready</div>
        )}
        
        {/* Delete button - only show for completed or error states */}
        {(source.status === 'completed' || source.status === 'error') && (
          <button
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(source.id);
            }}
            title="Delete document"
          >
            <Trash size={14} className="text-gray-500 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
};

const ContextSourcesSidebar: React.FC<ContextSourcesSidebarProps> = ({ onSelectResources }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const tempId = Date.now();
      // Add temporary source with processing status
      setSources(prev => [...prev, {
        id: tempId,
        name: file.name,
        path: URL.createObjectURL(file),
        status: 'processing'
      }]);
      
      try {
        const processedDoc = await DocumentService.processDocument(file);
        // Replace temporary source with processed document
        setSources(prev => prev.map(source => 
          source.id === tempId 
            ? { 
                ...processedDoc,
                path: URL.createObjectURL(file) // Keep the local URL for preview
              } 
            : source
        ));
      } catch (error) {
        console.error('Error processing document:', error);
        setSources(prev => prev.map(source => 
          source.id === tempId ? { 
            ...source, 
            status: 'error',
            error: ((error as AxiosError<{detail: string}>).response?.data?.detail) || 'Failed to process document'
          } : source
        ));
        // Optionally show error in UI
        alert(((error as AxiosError<{detail: string}>).response?.data?.detail) || 'Failed to process document');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const tempId = Date.now();
      // Add temporary source with processing status
      setSources(prev => [...prev, {
        id: tempId,
        name: file.name,
        path: URL.createObjectURL(file),
        status: 'processing'
      }]);
      
      try {
        const processedDoc = await DocumentService.processDocument(file);
        // Replace temporary source with processed document
        setSources(prev => prev.map(source => 
          source.id === tempId 
            ? { 
                ...processedDoc,
                path: URL.createObjectURL(file) // Keep the local URL for preview
              } 
            : source
        ));
      } catch (error) {
        console.error('Error processing document:', error);
        setSources(prev => prev.map(source => 
          source.id === tempId ? { 
            ...source, 
            status: 'error',
            error: ((error as AxiosError<{detail: string}>).response?.data?.detail) || 'Failed to process document'
          } : source
        ));
        // Optionally show error in UI
        alert(((error as AxiosError<{detail: string}>).response?.data?.detail) || 'Failed to process document');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await DocumentService.deleteDocument(id);
      setSources(prev => prev.filter(source => source.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      if ((error as AxiosError).response?.status === 404) {
        setSources(prev => prev.filter(source => source.id !== id));
      } else {
        alert('Failed to delete document. Please try again.');
      }
    }
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
        
        {/* File upload buttons */}
        <div className="space-y-2">
          <div className="flex">
            <label 
              className={`flex-grow bg-blue-600 text-white rounded-l-lg p-2 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer ${
                isDragOver ? 'bg-blue-700' : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
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

          {/* URL input field */}
          {showUrlInput && (
            <input
              type="url"
              placeholder="Enter URL..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          )}
        </div>

        {/* Document list */}
        <div className="mt-4 space-y-1">
          {sources.map(source => (
            <SourceItem
              key={source.id}
              source={source}
              onDelete={handleDelete}
              onSelect={(id) => handleResourceSelect(id)}
            />
          ))}
          
          {sources.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              No resources added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextSourcesSidebar;