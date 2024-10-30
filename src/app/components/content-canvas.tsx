'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TopBar from './top-bar';
import SectionCard from './section-card';
import { Section } from '@/lib/ai/types'; // Import the Section type

interface ContentCanvasProps {
  sections: Section[];
  activeSection: string | null;
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
  onSectionUpdate,
  onSectionDelete,
  onSectionAdd,
  onSectionRegenerate,
  onPurposeChange,
  onTitleChange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSections = async (title: string, purpose: string) => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/generate-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, purpose }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate sections');
      }

      const data = await response.json();
      
      // Replace existing sections with new ones
      // You might want to confirm with user before replacing or merge instead
      data.sections.forEach((section: Section) => {
        onSectionUpdate(section.id, section);
      });
    } catch (error) {
      console.error('Error generating sections:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsGenerating(false);
    }
  };

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
          {sections.map((section) => (
            <div
              key={section.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
            >
              <SectionCard
                section={section}
                isActive={activeSection === section.id}
                onUpdate={onSectionUpdate}
                onDelete={onSectionDelete}
                onRegenerate={onSectionRegenerate}
                onDragStart={handleDragStart}
                onTitleChange={onTitleChange}
              />
            </div>
          ))}
          
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