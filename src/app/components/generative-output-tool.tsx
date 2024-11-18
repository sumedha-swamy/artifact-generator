'use client';

import React, { useState } from 'react';
import ContextSourcesSidebar from './context-sources-sidebar';
import TopBar from './top-bar';
import EvaluationSidebar from './evaluation-sidebar';
import ContentCanvas from './content-canvas';
import TemplateModal from './template-modal';
import { Section, Resource } from '@/app/lib/types';

const GenerativeOutputTool: React.FC = () => {
  // State management
  const [sections, setSections] = useState<Section[]>([]); 
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState('New Document');
  const [documentPurpose, setDocumentPurpose] = useState('');
  const [isGeneratingSections, setIsGeneratingSections] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Record<string, number[]>>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

const handleResourceSelect = (sectionId: string, resourceIds: number[]) => {
  setSelectedResources(prev => ({
    ...prev,
    [sectionId]: resourceIds
  }));
};

 // Add this handler to receive resources from ContextSourcesSidebar
 const handleResourcesUpdate = (updatedResources: Resource[]) => {
  setResources(updatedResources);
};
  
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
    const newId = sections.length === 0 ? '1' : (Math.max(...sections.map(s => parseInt(s.id))) + 1).toString();
    const newSection: Section = {
      id: newId,
      title: `Section ${newId}`,
      content: '',
      strength: 0,
      description: 'New Section',
      isEditing: false,
      isGenerating: false,
      selectedSources: [],
      sourceOption: 'model',
      revisions: [],
    };
    setSections([...sections, newSection]);
  };

  const handleSectionRegenerate = async (sectionId: string, currentSections?: Section[]) => {
    try {
      // Use the passed sections if available, otherwise use state
      const sectionsToUse = currentSections || sections;
      
      // Update isGenerating state first
      setSections(prevSections => 
        prevSections.map(s => s.id === sectionId ? { ...s, isGenerating: true } : s)
      );
  
      // Use sectionsToUse instead of sections state
      const section = sectionsToUse.find(s => s.id === sectionId);
      if (!section) {
        console.error('Section not found:', sectionId);
        return;
      }
  
      const otherSections = sectionsToUse
        .filter(s => s.id !== sectionId)
        .map(s => ({
          title: s.title,
          content: s.content
        }));
  
      const response = await fetch('/api/generate-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentTitle,
          documentPurpose,
          sectionTitle: section.title,
          sectionDescription: section.description,
          otherSections
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }
  
      const data = await response.json();
  
      // Update section with new content
      setSections(prevSections => {
        return prevSections.map(s => {
          if (s.id === sectionId) {
            const revisions = [...(s.revisions || []), { content: data.content, description: s.description }];
            return {
              ...s,
              content: data.content,
              strength: data.strength,
              isGenerating: false,
              revisions,
              currentRevisionIndex: revisions.length - 1
            };
          }
          return s;
        });
      });
  
      return data;
    } catch (error) {
      console.error('Error regenerating section:', error);
      setSections(prevSections => 
        prevSections.map(s => s.id === sectionId ? { ...s, isGenerating: false } : s)
      );
      throw error;
    }
  };


  const handleGenerateAllContent = async () => {
    try {
      setIsGeneratingAll(true);
      
      // Generate sections first if none exist
      let sectionsToGenerate = sections;
      if (!sections || sections.length === 0) {
        sectionsToGenerate = await handleGenerateSections(documentTitle, documentPurpose);
      }
      
      // Pass the sectionsToGenerate to handleSectionRegenerate
      const regeneratePromises = sectionsToGenerate.map(section => 
        handleSectionRegenerate(section.id, sectionsToGenerate)
      );
      
      await Promise.all(regeneratePromises);
    } catch (error) {
      console.error('Error generating all content:', error);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Update handleGenerateSections to return a promise
  const handleGenerateSections = async (title: string, purpose: string): Promise<Section[]> => {
    try {
      setIsGeneratingSections(true);
      const response = await fetch('/api/generate-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          purpose 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate sections');
      }

      const data = await response.json();
      
      // Create new sections with all required properties
      const newSections = data.sections.map((section: any) => ({
        ...section,
        isEditing: false,
        isGenerating: false,
        selectedSources: [],
        sourceOption: 'model',
        revisions: [],
      }));

      // Update state
      setSections(newSections);
      setDocumentTitle(title);
      setDocumentPurpose(purpose);
      
      // Return the new sections directly
      return newSections;
    } catch (error) {
      console.error('Error generating sections:', error);
      throw error;
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
      sourceOption: 'model',
      revisions: [],
    }));

    setSections(newSections);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
  };

  // Calculate overall document strength
  const documentStrength = Math.round(
    sections.reduce((acc, section) => acc + section.strength, 0) / sections.length
  );

  const handleSelectResources = (selectedResources: any) => {
    // Implement the logic for handling selected resources
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-gray-200">
        <TopBar
          documentTitle={documentTitle}
          documentPurpose={documentPurpose}
          onPurposeChange={setDocumentPurpose}
          onTitleChange={setDocumentTitle}
          onGenerateSections={handleGenerateSections}
          isGenerating={isGeneratingSections}
          onGenerateAllContent={handleGenerateAllContent}
          isGeneratingAll={isGeneratingAll}
          sections={sections}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ContextSourcesSidebar 
          onTemplateClick={() => setShowTemplateModal(true)}
          onSelectResources={handleResourcesUpdate}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <ContentCanvas
            sections={sections}
            activeSection={activeSection}
            availableResources={resources}
            onSectionUpdate={handleSectionUpdate}
            onSectionDelete={handleSectionDelete}
            onSectionAdd={handleSectionAdd}
            onSectionRegenerate={handleSectionRegenerate}
            onPurposeChange={setDocumentPurpose}
            onTitleChange={setDocumentTitle}
          />
        </div>

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
