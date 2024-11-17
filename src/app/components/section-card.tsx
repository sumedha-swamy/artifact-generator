// section-card.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, MoveVertical, RefreshCcw, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceSelect } from './source-select';
import { ResourceSelectDialog } from './resource-select-dialog';
import { Section, Resource } from '@/app/lib/types';


interface SectionCardProps {
  section: Section;
  isActive: boolean;
  availableResources: Resource[]; // Add this prop
  onUpdate: (id: string, updates: Partial<Section>) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDragStart: (e: React.DragEvent<Element>, id: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isActive,
  availableResources,
  onUpdate,
  onDelete,
  onRegenerate,
  onDragStart,
  onTitleChange,
  onDragOver,
  onDrop
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const revisions = section.revisions || [];
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState(revisions.length > 0 ? revisions.length - 1 : 0);
  const [sourceOption, setSourceOption] = useState(section.sourceOption);
  const [isResourceSelectOpen, setIsResourceSelectOpen] = useState(false);

  // Update currentRevisionIndex when revisions change
  useEffect(() => {
    if (revisions.length > 0) {
      setCurrentRevisionIndex(revisions.length - 1);
    }
  }, [revisions.length]);

  // Get IDs of currently selected resources
  const selectedResourceIds = availableResources
    .filter(resource => section.selectedSources.includes(resource.name))
    .map(resource => resource.id);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(section.id, { content: e.target.value });
  };

  const handleRevisionChange = (index: number) => {
    if (index >= 0 && index < revisions.length) {
      setCurrentRevisionIndex(index);
      const revision = revisions[index];
      onUpdate(section.id, { content: revision.content, description: revision.description });
    }
  };

  const handleSourceOptionChange = (value: string) => {
    setSourceOption(value);
    onUpdate(section.id, { 
      sourceOption: value,
      // Clear selected sources if not using "selected" option
      selectedSources: value === 'selected' ? section.selectedSources : []
    });
  };

  const handleResourceSelect = (resourceId: number) => {
    const resource = availableResources.find(r => r.id === resourceId);
    if (!resource) return;

    const newSelectedSources = section.selectedSources.includes(resource.name)
      ? section.selectedSources.filter(name => name !== resource.name)
      : [...section.selectedSources, resource.name];

    onUpdate(section.id, { selectedSources: newSelectedSources });
  };

  const getStrengthDisplay = () => {
    return section.content.trim() ? `${section.strength}%` : 'N/A';
  };

  return (
    <Card 
      className={`bg-white rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.06)] ${
        isActive ? 'border-blue-500' : 'border-transparent'
      } hover:shadow-md transition-shadow`}
      draggable
      onDragStart={(e) => onDragStart(e, section.id)}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
            Strength: {getStrengthDisplay()}
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

      <CardContent className="space-y-4 p-4">
        {/* Description Field with Generate Button */}
        <div>
          <div className="relative mt-2">
            <div className="absolute -top-[9px] left-3 px-1.5 bg-white z-10">
              <span className="text-sm text-gray-500 font-medium">
                Description
              </span>
            </div>
            <textarea
              value={section.description}
              onChange={(e) => onUpdate(section.id, { description: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-700"
              rows={2}
            />
          </div>
          <button 
            className="mt-2 flex items-center gap-1 px-2.5 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
            onClick={() => onRegenerate(section.id)}
          >
            <RefreshCcw 
              size={14} 
              className={section.isGenerating ? 'animate-spin' : ''} 
            />
            {section.isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        
        {/* Content Textarea */}
        <textarea 
          className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-700"
          placeholder="Enter section content..."
          value={section.content}
          onChange={handleContentChange}
        />
        
        {/* Revision Navigation */}
        <div className="flex justify-center items-center mt-2 gap-2">
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
            onClick={() => handleRevisionChange(currentRevisionIndex - 1)}
            disabled={currentRevisionIndex <= 0}
          >
            &lt;
          </button>
          <span className="text-sm text-gray-600">
            {revisions.length === 0 ? (
              "No revisions"
            ) : (
              `Revision ${currentRevisionIndex + 1} of ${revisions.length}`
            )}
          </span>
          <button 
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
            onClick={() => handleRevisionChange(currentRevisionIndex + 1)}
            disabled={currentRevisionIndex >= revisions.length - 1}
          >
            &gt;
          </button>
        </div>

        {/* Source Options and Resource Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Source:</span>
            <SourceSelect
              value={sourceOption}
              onChange={handleSourceOptionChange}
            />
          </div>
          
          {/* Conditionally render Add Resource button */}
          {sourceOption === 'selected' && section.selectedSources.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResourceSelectOpen(true)}
              className="w-full"
            >
              Add Resource
            </Button>
          )}
          
          {/* Selected resources display */}
          {sourceOption === 'selected' && section.selectedSources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {section.selectedSources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-sm text-blue-700"
                >
                  <FileText size={12} />
                  <span className="truncate max-w-[150px]">{source}</span>
                  <button
                    onClick={() => {
                      const newSources = section.selectedSources.filter((_, i) => i !== index);
                      onUpdate(section.id, { selectedSources: newSources });
                    }}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResourceSelectOpen(true)}
                className="h-[26px] px-2"
              >
                <Plus size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Resource Selection Dialog */}
        <ResourceSelectDialog
          open={isResourceSelectOpen}
          onOpenChange={setIsResourceSelectOpen}
          resources={availableResources}
          selectedResources={selectedResourceIds}
          onResourceSelect={handleResourceSelect}
        />
      </CardContent>
    </Card>
  );
};

export default SectionCard;
