'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TopBar from './top-bar';
import SectionCard from './section-card';
import { Section, Resource } from '@/app/lib/types'; 

interface ContentCanvasProps {
  sections: Section[];
  activeSection: string | null;
  availableResources: Resource[];
  onSectionUpdate: (sectionId: string, data: Partial<Section>) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionAdd: () => void;
  onSectionRegenerate: (sectionId: string) => void;
  onPurposeChange: (purpose: string) => void;
  onTitleChange: (title: string) => void;
}

const ContentCanvas: React.FC<ContentCanvasProps> = ({ 
  sections,
  activeSection,
  availableResources,
  onSectionUpdate,
  onSectionDelete,
  onSectionAdd,
  onSectionRegenerate,
  onPurposeChange,
  onTitleChange
}) => {

  const handleDragStart = (e: React.DragEvent<Element>, sectionId: string) => {
        e.dataTransfer.setData('text/plain', sectionId);
      };
    
      const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
      };
    
      const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId !== targetId) {
          // Handle section reordering here
        }
      };
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
      {/* Sections Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Section Cards */}
          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                availableResources={availableResources}
                onUpdate={onSectionUpdate}
                onDelete={onSectionDelete}
                onRegenerate={onSectionRegenerate}
                onDragStart={handleDragStart}
                onTitleChange={onTitleChange}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
              />
            ))}
          </div>
          
          {/* Add Section Button */}
          <button 
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg 
                     text-gray-600 hover:border-blue-500 hover:text-blue-600 
                     hover:bg-blue-50 transition-colors flex items-center justify-center gap-2
                     bg-white shadow-sm"
            onClick={onSectionAdd}
          >
            <Plus size={20} /> Add New Section
          </button>
        </div>
      </div>

      {/* Drop Zone Indicator */}
      <div 
        className="h-16 m-6 border-2 border-dashed border-gray-300 rounded-lg hidden"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
      />
    </div>
  );
};

export default ContentCanvas;