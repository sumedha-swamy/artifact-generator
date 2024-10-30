'use client';

import React, { useState } from 'react';
import ContextSourcesSidebar from './context-sources-sidebar';
import TopBar from './top-bar';
import EvaluationSidebar from './evaluation-sidebar';
import ContentCanvas from './content-canvas';
import TemplateModal from './template-modal';
import { Section } from '@/lib/ai/types';

const GenerativeOutputTool: React.FC = () => {
  // State management
  const [sections, setSections] = useState<Section[]>([
    { 
      id: '1', 
      title: 'Section 1', 
      content: '', 
      strength: 85, 
      description: 'Introduction',
      isEditing: false,
      isGenerating: false,
      selectedSources: ['Document1.pdf', 'Website Link'],
    }
  ]);
  
  const [activeSection, setActiveSection] = useState('1');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState('New Document');
  const [documentPurpose, setDocumentPurpose] = useState('');
  const [isGeneratingSections, setIsGeneratingSections] = useState(false);
  
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
    const newSection: Section = {
      id: newId,
      title: `Section ${newId}`,
      content: '',
      strength: 0,
      description: 'New Section',
      isEditing: false,
      isGenerating: false,
      selectedSources: [],
    };
    setSections([...sections, newSection]);
  };

  const handleSectionRegenerate = async (sectionId: string) => {
    try {
      // Set the section to generating state
      handleSectionUpdate(sectionId, { isGenerating: true });

      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      // Call the API to regenerate the section
      const response = await fetch('/api/generate-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          purpose: documentPurpose,
          sectionTitle: section.title,
          sectionDescription: section.description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }

      const data = await response.json();
      const newSection = data.sections[0]; // Assume we get back one section

      // Update the section with the new content
      handleSectionUpdate(sectionId, {
        ...newSection,
        isGenerating: false,
        strength: Math.floor(Math.random() * 30) + 70, // You might want to get this from the AI
      });
    } catch (error) {
      console.error('Error regenerating section:', error);
      handleSectionUpdate(sectionId, { isGenerating: false });
    }
  };

  // Handle AI section generation
  const handleGenerateSections = async (title: string, purpose: string) => {
    try {
      setIsGeneratingSections(true);
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
      setSections(data.sections);
      setDocumentTitle(title);
      setDocumentPurpose(purpose);
    } catch (error) {
      console.error('Error generating sections:', error);
    } finally {
      setIsGeneratingSections(false);
    }
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
    
    const newSections: Section[] = templateSections.map((title, index) => ({
      id: (index + 1).toString(),
      title,
      content: '',
      strength: 0,
      description: title,
      isEditing: false,
      isGenerating: false,
      selectedSources: [],
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
      {/* Top Bar */}
      <TopBar
        documentTitle={documentTitle}
        documentPurpose={documentPurpose}
        onPurposeChange={setDocumentPurpose}
        onTitleChange={setDocumentTitle}
        onGenerateSections={handleGenerateSections}
        isGenerating={isGeneratingSections}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ContextSourcesSidebar 
          onTemplateClick={() => setShowTemplateModal(true)}
        />

        {/* Main Content Area */}
        <ContentCanvas
          sections={sections}
          activeSection={activeSection}
          onSectionUpdate={handleSectionUpdate}
          onSectionDelete={handleSectionDelete}
          onSectionAdd={handleSectionAdd}
          onSectionRegenerate={handleSectionRegenerate}
          onPurposeChange={setDocumentPurpose}
          onTitleChange={setDocumentTitle}
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
