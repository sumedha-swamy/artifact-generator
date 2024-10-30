'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, MoveVertical, RefreshCcw, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface Section {
  id: string;
  title: string;
  content: string;
  description: string;
  strength: number;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: string[];
}

interface SectionCardProps {
  section: Section;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<Section>) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDragStart: (e: React.DragEvent<Element>, id: string) => void;
  onTitleChange: (id: string, title: string) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isActive,
  onUpdate,
  onDelete,
  onRegenerate,
  onDragStart,
  onTitleChange
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(section.id, { content: e.target.value });
  };

  return (
    <Card 
      className={`bg-white rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.06)] ${
        isActive ? 'border-blue-500' : 'border-transparent'
      } hover:shadow-md transition-shadow`}
      draggable
      onDragStart={(e) => onDragStart(e, section.id)}
    >
        {/* Section Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-gray-50 rounded-t-lg border-b">
        {/* Title Area */}
        <div className="flex items-center gap-2">
          <MoveVertical size={16} className="text-gray-400 cursor-move" />
          {isEditingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onTitleChange(section.id, e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                }
              }}
              className="text-lg text-gray-700 font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-[200px]"
              autoFocus
            />
          ) : (
            <CardTitle 
              className="text-lg text-gray-700 font-semibold cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {section.title}
            </CardTitle>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              section.strength >= 80 ? 'bg-green-500' :
              section.strength >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            Strength: {section.strength}%
          </div>
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-red-500"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 size={16} />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
            {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </CardHeader>

      {/* Section Content */}
      <CardContent className="space-y-4 p-4">
        {/* Description Field with Generate Button */}
        <div>
          <div className="relative mt-2">
            <div className="absolute -top-[9px] left-3 px-1.5 bg-white z-10">
              <span className="text-sm text-gray-500 font-medium">
                Description
              </span>
            </div>
            <div className="relative">
              <textarea
                value={section.description}
                onChange={(e) => onUpdate(section.id, { description: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-700"
                rows={2}
              />
              <button 
                className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
                onClick={() => onRegenerate(section.id)}
              >
                <RefreshCcw 
                  size={14} 
                  className={section.isGenerating ? 'animate-spin' : ''} 
                />
                {section.isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Content Textarea */}
        <textarea 
          className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-700"
          placeholder="Enter section content..."
          value={section.content}
          onChange={handleContentChange}
        />
        
        {/* Source Tags */}
        <div className="flex flex-wrap gap-2">
          {section.selectedSources.map((source, i) => (
            <span 
              key={i} 
              className="px-2 py-1 bg-gray-50 rounded-full text-sm flex items-center gap-1 text-gray-600 border border-gray-200"
            >
              <FileText size={12} />
              {source}
              <button 
                className="ml-1 hover:text-red-500"
                onClick={() => {
                  const newSources = section.selectedSources.filter((_, index) => index !== i);
                  onUpdate(section.id, { selectedSources: newSources });
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button className="px-2 py-1 border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-colors text-gray-600">
            + Add Source
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionCard;