'use client';

import React, { useState } from 'react';
import ContextSourcesSidebar from './context-sources-sidebar';
import TopBar from './top-bar';
import EvaluationSidebar from './evaluation-sidebar';
import ContentCanvas from './content-canvas';
import TemplateModal from './template-modal';

interface Section {
  id: string;
  title: string;
  content: string;
  strength: number;
  purpose: string;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: string[];
  instructions: string;
}

const GenerativeOutputTool: React.FC = () => {
    // State management
    const [sections, setSections] = useState([
        { 
          id: '1', 
          title: 'Section 1', 
          content: '', 
          strength: 85, 
          purpose: 'Introduction',
          isEditing: false,
          isGenerating: false,
          selectedSources: ['Document1.pdf', 'Website Link'],
          instructions: 'Write an engaging introduction'
        }
      ]);
      
      const [activeSection, setActiveSection] = useState('1');
      const [showTemplateModal, setShowTemplateModal] = useState(false);
      const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
      
      // Active sources for the evaluation sidebar
      const activeSources = [
        { id: 1, type: 'document', name: 'Document1.pdf', references: 4 },
        { id: 2, type: 'link', name: 'Website Link', references: 2 }
      ];
    
      // Suggestions for the evaluation sidebar
      const suggestions = [
        'Consider adding more technical specifications in Section 2.',
        'The conclusion could be strengthened with a clear call to action.'
      ];
    
      // Section handlers
      const handleSectionUpdate = (sectionId: string, updates: Partial<Section>) => {
        setSections(sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        ));
      };
    
      const handleSectionDelete = (sectionId: string) => {
        setSections(sections.filter(section => section.id !== sectionId));
      };
    
      const handleSectionAdd = () => {
        const newId = (Math.max(...sections.map(s => parseInt(s.id))) + 1).toString();
        setSections([...sections, {
          id: newId,
          title: `Section ${newId}`,
          content: '',
          strength: 0,
          purpose: 'New Section',
          isEditing: false,
          isGenerating: false,
          selectedSources: [],
          instructions: ''
        }]);
      };
    
      const handleSectionRegenerate = (sectionId: string) => {
        setSections(sections.map(section =>
          section.id === sectionId 
            ? { ...section, isGenerating: true }
            : section
        ));
        
        // Simulate AI generation
        setTimeout(() => {
          setSections(sections.map(section =>
            section.id === sectionId
              ? { 
                  ...section, 
                  isGenerating: false,
                  strength: Math.floor(Math.random() * 30) + 70,
                  content: `Generated content for section ${sectionId}`
                }
              : section
          ));
        }, 1500);
      };
    
      // Template handlers
      const handleTemplateSelect = (templateId: number) => {
        setSelectedTemplate(templateId);
      };
    
      const handleTemplateApply = () => {
        if (!selectedTemplate) return;
        
        const templateSections: string[] = {
          1: ['Overview', 'Features', 'Benefits', 'Call to Action'],
          2: ['Introduction', 'Requirements', 'Installation', 'Usage'],
          3: ['Abstract', 'Methods', 'Results', 'Discussion']
        }[selectedTemplate] || [];
        
        const newSections = templateSections.map((title, index) => ({
          id: (index + 1).toString(), // Convert number to string
          title,
          content: '',
          strength: 0,
          purpose: title,
          isEditing: false,
          isGenerating: false,
          selectedSources: [],
          instructions: `Write content for ${title} section`
        }));
    
        setSections(newSections);
        setShowTemplateModal(false);
        setSelectedTemplate(null);
      };
    
      // Calculate overall document strength
      const documentStrength = Math.round(
        sections.reduce((acc, section) => acc + section.strength, 0) / sections.length
      );
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ContextSourcesSidebar 
          onTemplateClick={() => setShowTemplateModal(true)}
        />

        {/* Main Content Area */}
        <ContentCanvas
          sections={sections}
          activeSection={activeSection.toString()}
          onSectionUpdate={handleSectionUpdate}
          onSectionDelete={handleSectionDelete}
          onSectionAdd={handleSectionAdd}
          onSectionRegenerate={handleSectionRegenerate}
          onPurposeChange={() => {}}
          onTitleChange={(title: string) => 
            handleSectionUpdate(activeSection, { title })}
        />
  
        {/* Right Sidebar */}
        <EvaluationSidebar
          documentStrength={documentStrength}
          activeSources={activeSources}
          suggestions={suggestions}
        />
  
        {/* Template Modal */}
        <TemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          onApply={handleTemplateApply}
        />
      </div>
    </div>
  );
};

export default GenerativeOutputTool;

