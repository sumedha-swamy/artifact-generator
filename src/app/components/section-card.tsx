// section-card.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, MoveVertical, RefreshCcw, Plus, FileText, Eye, Edit2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceSelect } from './source-select';
import { ResourceSelectDialog } from './resource-select-dialog';
import { Section, Resource } from '@/app/lib/types';
import ReactMarkdown from 'react-markdown';
import { Toggle } from "@/components/ui/toggle";
import remarkGfm from 'remark-gfm';


interface SectionCardProps {
  section: Section;
  isActive: boolean;
  availableResources: Resource[];
  onUpdate: (id: string, updates: Partial<Section>) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onDragStart: (e: React.DragEvent<Element>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onTitleChange: (title: string) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isActive,
  availableResources,
  onUpdate,
  onDelete,
  onRegenerate,
  onDragStart,
  onDragOver,
  onDrop,
  onTitleChange
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const revisions = section.revisions || [];
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState(revisions.length > 0 ? revisions.length - 1 : 0);
  const [sourceOption, setSourceOption] = useState(section.sourceOption || 'all');
  const [isResourceSelectOpen, setIsResourceSelectOpen] = useState(false);
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);

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

  const handleTemperatureChange = (value: number) => {
    onUpdate(section.id, { temperature: value });
  };

  const handleLengthChange = (value: string) => {
    onUpdate(section.id, { estimatedLength: value });
  };

  return (
    <Card 
      className={`bg-white rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.06)] ${
        isActive ? 'border-blue-500' : 'border-transparent'
      } hover:shadow-md transition-shadow`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-gray-50 rounded-t-lg border-b">
        <div className="flex items-center gap-2">
          <div
            draggable
            onDragStart={(e) => onDragStart(e, section.id)}
            className="cursor-move"
          >
            <MoveVertical size={16} className="text-gray-400" />
          </div>
          {isEditingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
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

        {/* Delete button */}
        <button
          onClick={() => onDelete(section.id)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
        </button>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* Description Field */}
        <div className="mb-4">
          <div className="relative">
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
        </div>

        {/* Key Points Field */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute -top-[9px] left-3 px-1.5 bg-white z-10">
              <span className="text-sm text-gray-500 font-medium">
                Key Points
              </span>
            </div>
            <div className="w-full p-3 border border-gray-200 rounded-lg bg-white">
              <div className="flex flex-wrap gap-2 mb-2">
                {(section.keyPoints || []).map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 max-w-full px-2.5 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 break-words"
                  >
                    <span className="truncate flex-1 min-w-0">{point}</span>
                    <button
                      onClick={() => {
                        const newPoints = [...(section.keyPoints || [])];
                        newPoints.splice(index, 1);
                        onUpdate(section.id, { keyPoints: newPoints });
                      }}
                      className="flex-shrink-0 hover:text-gray-900 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem('newKeyPoint') as HTMLInputElement;
                  const newPoint = input.value.trim();
                  if (newPoint) {
                    const newPoints = [...(section.keyPoints || []), newPoint];
                    onUpdate(section.id, { keyPoints: newPoints });
                    input.value = '';
                  }
                }}
              >
                <input
                  name="newKeyPoint"
                  type="text"
                  placeholder="Add a key point and press Enter..."
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Generation Controls - with better spacing */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
          <div className="flex items-center gap-4">
            {/* Length Control */}
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">
                Length:
              </label>
              <input
                type="text"
                value={section.estimatedLength || '1 paragraph'}
                onChange={(e) => handleLengthChange(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="e.g., 500 words, 2 paragraphs"
              />
            </div>

            {/* Temperature Control */}
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">
                Creativity:
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={section.temperature ?? 0.7}
                  onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-gray-500 w-8">
                  {(section.temperature ?? 0.7).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button 
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-white transition-colors text-gray-600"
            onClick={() => onRegenerate(section.id)}
            disabled={section.isGenerating}
          >
            <RefreshCcw 
              size={14} 
              className={section.isGenerating ? 'animate-spin' : ''} 
            />
            {section.isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Content</span>
            <Toggle
              pressed={isMarkdownPreview}
              onPressedChange={setIsMarkdownPreview}
              size="sm"
              aria-label="Toggle markdown preview"
            >
              {isMarkdownPreview ? <Edit2 size={14} /> : <Eye size={14} />}
            </Toggle>
          </div>
          
          {isMarkdownPreview ? (
            <div className="prose prose-sm max-w-none p-3 border border-gray-200 rounded-lg bg-white min-h-[8rem] overflow-y-auto">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="prose-table:table-auto prose-table:w-full prose-td:border prose-td:p-2 prose-th:border prose-th:p-2"
              >
                {section.content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea 
              className="w-full min-h-[8rem] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-700 resize-y"
              placeholder="Enter section content in markdown format..."
              value={section.content}
              onChange={handleContentChange}
            />
          )}
        </div>
        
        {/* Revision Navigation - Only show if there are revisions */}
        {revisions.length > 0 && (
          <div className="flex justify-center items-center mt-2 gap-2">
            <button 
              className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
              onClick={() => handleRevisionChange(currentRevisionIndex - 1)}
              disabled={currentRevisionIndex <= 0}
            >
              &lt;
            </button>
            <span className="text-sm text-gray-600">
              Revision {currentRevisionIndex + 1} of {revisions.length}
            </span>
            <button 
              className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
              onClick={() => handleRevisionChange(currentRevisionIndex + 1)}
              disabled={currentRevisionIndex >= revisions.length - 1}
            >
              &gt;
            </button>
          </div>
        )}

        {/* Source Options and Resource Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Source:</span>
            <SourceSelect
              value={sourceOption || ''}
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
