'use client';

import React, { useState, useEffect } from 'react';
import ContextSourcesSidebar from './context-sources-sidebar';
import TopBar from './top-bar';
import ContentCanvas from './content-canvas';
import TemplateModal from './template-modal';
import PlanningSidebar from './planning-sidebar';
import { Section, Resource } from '@/app/lib/types';
import EvaluationPanel from './evaluation-panel';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface PlanningState {
  currentPlan: string;
  isPlanning: boolean;
  isPlanFinalized: boolean;
}

interface EvaluationResult {
  overallScore: number;
  categories: {
    readability: number;
    relevance: number;
    completeness: number;
    factualSupport: number;
    persuasiveness: number;
    consistency: number;
  };
  improvements: string[];
  detailedFeedback: string;
}

const GenerativeOutputTool: React.FC = () => {
  // State management
  const [sections, setSections] = useState<Section[]>([]); 
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState('New Document');
  const [documentPurpose, setDocumentPurpose] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Record<string, number[]>>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [documentSettings, setDocumentSettings] = useState({
    defaultLength: 'As needed for comprehensive coverage',
    defaultTemperature: 0.7
  });

  // New planning state
  const [planningState, setPlanningState] = useState<PlanningState>({
    currentPlan: '',
    isPlanning: false,
    isPlanFinalized: false,
  });

  const [activeSidebarPanel, setActiveSidebarPanel] = useState<'planning' | 'evaluation'>('planning');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Add state for evaluation loading
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Add this with other state declarations
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const [isApplyingImprovements, setIsApplyingImprovements] = useState(false);

  useEffect(() => {
    if (planningState.currentPlan) {
      setIsSidebarVisible(true);
    }
  }, [planningState.currentPlan]);

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
    // Generate a new ID based on the current sections
    const newId = sections.length === 0 
      ? '1' 
      : (Math.max(...sections.map(s => parseInt(s.id))) + 1).toString(); // Ensure IDs are numeric

    const newSection: Section = {
      id: newId,
      title: `Section ${newId}`,
      content: '',
      strength: 0,
      description: 'New Section',
      isEditing: false,
      isGenerating: false,
      selectedSources: [],
      sourceOption: 'all',
      revisions: [],
      estimatedLength: '1 paragraph',
      temperature: 0.7
    };

    setSections([...sections, newSection]);
  };

  const handleSectionRegenerate = async (sectionId: string, sectionSettings: { temperature: number; estimatedLength: string }) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      setSections(prevSections => 
        prevSections.map(s => s.id === sectionId ? { ...s, isGenerating: true } : s)
      );
      
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle,
          documentPurpose,
          sectionTitle: section.title,
          sectionDescription: section.description,
          otherSections: sections,
          selectedSources: section.selectedSources,
          sourceOption: section.sourceOption,
          keyPoints: section.keyPoints || [],
          improvements: [],
          isImprovement: false,
          previousContent: section.content,
          documentSettings: {
            defaultTemperature: sectionSettings.temperature,
            defaultLength: sectionSettings.estimatedLength
          }
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
              content: data.content.content || data.content,
              strength: data.content.strength || data.strength,
              isGenerating: false,
              revisions,
              currentRevisionIndex: revisions.length - 1
            };
          }
          return s;
        });
      });
      
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
      const numberOfPasses = 3; // Configure number of refinement passes
      
      let sectionsToGenerate = sections;
      
      for (let pass = 1; pass <= numberOfPasses; pass++) {
        // Regenerate sections in order
        for (const section of sectionsToGenerate) {
          await handleSectionRegenerate(section.id, { 
            temperature: section.temperature ?? 0.7, 
            estimatedLength: section.estimatedLength || 'medium' 
          });
        }

        // Short pause between passes to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Final evaluation after all passes
      if (activeSidebarPanel !== 'evaluation') {
        setActiveSidebarPanel('evaluation');
      }
      
    } catch (error) {
      console.error('Error generating all content:', error);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleGeneratePlan = async () => {
    setPlanningState(prev => ({ ...prev, isPlanning: true }));
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          purpose: documentPurpose,
          // Add any references or data sources here
          references: [],
          dataSources: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate initial plan');
      }

      const { plan } = await response.json();

      setPlanningState(prev => ({
        ...prev,
        currentPlan: plan,
        isPlanning: false,
      }));
    } catch (error) {
      console.error('Error generating plan:', error);
      setPlanningState(prev => ({ ...prev, isPlanning: false }));
    }
  };

  const handlePlanFeedback = async (feedback: string) => {
    setPlanningState(prev => ({ ...prev, isPlanning: true }));
    try {
      const response = await fetch('/api/generate-plan/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPlan: planningState.currentPlan,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine plan');
      }

      const { plan } = await response.json();
      setPlanningState(prev => ({
        ...prev,
        currentPlan: plan,
        isPlanning: false,
      }));
    } catch (error) {
      console.error('Error refining plan:', error);
      setPlanningState(prev => ({ ...prev, isPlanning: false }));
    }
  };

  const handleFinalizePlan = async () => {
    setPlanningState(prev => ({ ...prev, isPlanning: true }));
    try {
      const response = await fetch('/api/generate-plan/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalPlan: planningState.currentPlan,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize plan');
      }

      const { sections: newSections } = await response.json();
      setSections(newSections);
      setPlanningState(prev => ({
        ...prev,
        isPlanFinalized: true,
        isPlanning: false,
      }));
    } catch (error) {
      console.error('Error finalizing plan:', error);
      setPlanningState(prev => ({ ...prev, isPlanning: false }));
    }
  };

  const handleResetPlan = () => {
    setPlanningState({
      currentPlan: '',
      isPlanning: false,
      isPlanFinalized: false,
    });
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
      sourceOption: 'all',
      revisions: [],
      estimatedLength: 'As needed for comprehensive coverage',
      temperature: 0.7
    }));

    setSections(newSections);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
  };

  const handleSelectResources = (selectedResources: any) => {
    // Implement the logic for handling selected resources
  };

  const handleEvaluate = async () => {
    try {
      // Get the latest revision content for each section
      const sectionsWithLatestContent = sections.map(section => ({
        ...section,
        content: section.revisions && section.revisions.length > 0
          ? section.revisions[section.revisions.length - 1].content
          : section.content
      }));


      const response = await fetch('/api/evaluate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle,
          documentPurpose,
          sections: sectionsWithLatestContent
        }),
      });
      
      if (!response.ok) throw new Error('Evaluation failed');
      const result = await response.json();
      setEvaluationResult(result);
      return result;
    } catch (error) {
      console.error('Error evaluating document:', error);
      throw error;
    }
  };

  const handleApplyImprovements = async () => {
    if (!evaluationResult) return;
    
    setIsApplyingImprovements(true);
    try {
      let updatedSections = [...sections];
      
      for (let i = 0; i < updatedSections.length; i++) {
        const section = updatedSections[i];
        
        setSections(prevSections => 
          prevSections.map(s => s.id === section.id ? { ...s, isGenerating: true } : s)
        );

        try {
          const response = await fetch('/api/generate-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentTitle,
              documentPurpose,
              sectionTitle: section.title,
              sectionDescription: section.description,
              otherSections: updatedSections,
              selectedSources: section.selectedSources,
              sourceOption: section.sourceOption,
              keyPoints: section.keyPoints || [],
              improvements: evaluationResult.improvements,
              isImprovement: true,
              previousContent: section.content,
              documentSettings: {
                defaultTemperature: section.temperature ?? 0.7,
                defaultLength: section.estimatedLength || 'medium'
              }
            }),
          });
          
          if (!response.ok) throw new Error('Failed to improve section');
          const result = await response.json();
          
          
          updatedSections[i] = {
            ...section,
            content: result.content,
            revisions: [...(section.revisions || []), {
              content: section.content,
              timestamp: new Date().toISOString(),
              type: 'improvement'
            }],
            strength: result.strength,
            isGenerating: false
          };

          setSections(updatedSections);
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error improving section ${section.title}:`, error);
          setSections(prevSections => 
            prevSections.map(s => s.id === section.id ? { ...s, isGenerating: false } : s)
          );
        }
      }

      setIsEvaluating(true);
      await handleEvaluate();
      setIsEvaluating(false);
      
    } catch (error) {
      console.error('Error applying improvements:', error);
    } finally {
      setIsApplyingImprovements(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="w-full bg-white border-b border-gray-200 z-10">
        <TopBar
          documentTitle={documentTitle}
          documentPurpose={documentPurpose}
          onPurposeChange={setDocumentPurpose}
          onTitleChange={setDocumentTitle}
          onGeneratePlan={handleGeneratePlan}
          onGenerateAllContent={handleGenerateAllContent}
          isPlanning={planningState.isPlanning}
          isGeneratingAll={isGeneratingAll}
          sections={sections}
          documentSettings={documentSettings}
          onSettingsChange={(updates) => setDocumentSettings(prev => ({ ...prev, ...updates }))}
          isPlanFinalized={planningState.isPlanFinalized}
          onReset={handleResetPlan}
        />
      </div>

      {/* Main Content Area with Sidebars */}
      <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full bg-white border-r border-gray-200">
              <ContextSourcesSidebar 
                onTemplateClick={() => setShowTemplateModal(true)}
                onSelectResources={handleResourcesUpdate}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-100 hover:bg-gray-200 transition-colors duration-150" />

          {/* Center Content */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full overflow-y-auto bg-white">
              <div className="max-w-5xl mx-auto p-6">
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
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-100 hover:bg-gray-200 transition-colors duration-150" />

          {/* Right Sidebar */}
          <Panel defaultSize={20} minSize={15}>
            <div className="flex flex-col h-full">
              {/* Tab Buttons */}
              <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <button 
                  onClick={() => {
                    setActiveSidebarPanel('planning');
                    setIsSidebarVisible(true);
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 
                    ${activeSidebarPanel === 'planning' 
                      ? 'border-blue-500 text-blue-600 bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Planning
                </button>
                <button 
                  onClick={() => {
                    setActiveSidebarPanel('evaluation');
                    setIsSidebarVisible(true);
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2
                    ${activeSidebarPanel === 'evaluation'
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Evaluation
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className={`h-full bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
                  isSidebarVisible ? 'translate-x-0' : 'translate-x-full'
                }`}>
                  {activeSidebarPanel === 'planning' ? (
                    <PlanningSidebar
                      plan={planningState.currentPlan}
                      isVisible={isSidebarVisible}
                      onToggle={() => setIsSidebarVisible(!isSidebarVisible)}
                      onFeedback={handlePlanFeedback}
                      onFinalize={handleFinalizePlan}
                      isProcessing={planningState.isPlanning}
                      isPlanFinalized={planningState.isPlanFinalized}
                      onReset={handleResetPlan}
                    />
                  ) : (
                    <EvaluationPanel
                      sections={sections}
                      documentTitle={documentTitle}
                      documentPurpose={documentPurpose}
                      onEvaluate={async () => {
                        setIsEvaluating(true);
                        try {
                          await handleEvaluate();
                        } finally {
                          setIsEvaluating(false);
                        }
                      }}
                      onApplyImprovements={handleApplyImprovements}
                      isEvaluating={isEvaluating}
                      isApplyingImprovements={isApplyingImprovements}
                      evaluationResult={evaluationResult}
                    />
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={handleTemplateSelect}
        onApply={handleTemplateApply}
      />
    </div>
  );
};

export default GenerativeOutputTool;
