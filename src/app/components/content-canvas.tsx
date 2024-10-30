'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import TopBar from './top-bar';
import SectionCard from './section-card';

interface Section {
  id: string;
  title: string;
  content: string;
  purpose: string;
  strength: number;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: any[];
}

interface ContentCanvasProps {
  sections: Section[];
  activeSection: string | null;
  onSectionUpdate: (sectionId: string, data: any) => void;
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
      {/* Top Bar */}
      <TopBar 
        documentTitle="New Document"
        documentPurpose="Describe your document's purpose, target audience, and key requirements. Be specific about tone and desired outcomes."
        onPurposeChange={onPurposeChange}
        onTitleChange={onTitleChange}
      />

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