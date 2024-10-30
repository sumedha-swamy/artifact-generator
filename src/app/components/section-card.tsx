'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, MoveVertical, RefreshCcw, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface Section {
  id: string;
  title: string;
  content: string;
  purpose: string;
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
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isActive,
  onUpdate,
  onDelete,
  onRegenerate,
  onDragStart
}) => {
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(section.id, { content: e.target.value });
  };

  // Rest of the component remains the same
  return (
    <Card 
      className={`border ${
        isActive ? 'border-blue-500' : 'border-gray-200'
      } hover:shadow-md transition-shadow`}
      draggable
      onDragStart={(e) => onDragStart(e, section.id)}
    >
        {/* Section Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Title Area */}
        <div className="flex items-center gap-2">
          <MoveVertical size={16} className="text-gray-400 cursor-move" />
          {section.isEditing ? (
            <input
              type="text"
              value={section.title}
              className="border rounded px-2 py-1"
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              onBlur={() => onUpdate(section.id, { isEditing: false })}
              autoFocus
            />
          ) : (
            <CardTitle className="text-lg text-gray-900 font-semibold">
              <button
                className="text-left hover:bg-gray-100 px-2 py-1 rounded w-full text-gray-900 " 
                onClick={() => onUpdate(section.id, { isEditing: true})}
              >
                {section.title}
              </button>
            </CardTitle>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Strength Indicator */}
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              section.strength >= 80 ? 'bg-green-500' :
              section.strength >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            Strength: {section.strength}%
          </div>
          
          {/* Action Buttons */}
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600"
            onClick={() => onUpdate(section.id, { isEditing: true })}
          >
            <Edit size={16} />
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600"
            onClick={() => onRegenerate(section.id)}
          >
            <RefreshCcw 
              size={16} 
              className={section.isGenerating ? 'animate-spin' : ''} 
            />
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-red-500"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 size={16} />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600">
            {isActive ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </CardHeader>

      {/* Section Content */}
      <CardContent>
        {/* Purpose and Generate Button */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">Purpose: {section.purpose}</p>
            <button 
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              onClick={() => onRegenerate(section.id)}
            >
              <RefreshCcw size={16} /> Generate
            </button>
          </div>
          
          {/* Content Textarea */}
          <textarea 
            className="w-full h-32 p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter section content..."
            value={section.content}
            onChange={handleContentChange}
          />
        </div>
        
        {/* Source Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {section.selectedSources.map((source, i) => (
            <span 
              key={i} 
              className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1 text-gray-600"
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
          <button className="px-2 py-1 border rounded-full text-sm hover:bg-gray-50 transition-colors text-gray-600">
            + Add Source
          </button>
        </div>
        
        {/* Suggestions Alert */}
        {section.strength < 80 && (
          <Alert className="bg-blue-50 text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Suggestion: Add more specific examples from the product documentation to strengthen this section.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionCard;