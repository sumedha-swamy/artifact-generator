'use client';

import React from 'react';
import { Layout, FileText, Code, BookOpen, LucideIcon } from 'lucide-react';
import ModalOverlay from './modal-overlay';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: number | null;
  onTemplateSelect: (id: number) => void;
  onApply: () => void;
}

interface Template {
  id: number;
  name: string;
  description: string;
  sections: string[];
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'green';
}

const templates: Template[] = [
  {
    id: 1,
    name: 'Marketing Copy',
    description: 'Perfect for product marketing materials',
    sections: ['Overview', 'Features', 'Benefits', 'Call to Action'],
    icon: Layout,
    color: 'blue'
  },
  {
    id: 2,
    name: 'Technical Doc',
    description: 'Detailed technical documentation template',
    sections: ['Introduction', 'Requirements', 'Installation', 'Usage'],
    icon: Code,
    color: 'purple'
  },
  {
    id: 3,
    name: 'Research Paper',
    description: 'Academic research paper format',
    sections: ['Abstract', 'Methods', 'Results', 'Discussion'],
    icon: BookOpen,
    color: 'green'
  }
];

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedTemplate,
  onTemplateSelect,
  onApply,
}) => {
  const getIconBackground = (color: 'blue' | 'purple' | 'green') => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600'
    };
    return colors[color] || colors.blue;
  };

  const modalContent = (
    <div className="space-y-4">
      {/* Template List */}
      <div className="grid gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="flex items-start gap-3">
              {/* Template Icon */}
              <div className={`p-2 rounded ${getIconBackground(template.color)}`}>
                <template.icon size={20} />
              </div>
              
              {/* Template Content */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                
                {/* Section Tags */}
                <div className="flex flex-wrap  gap-1">
                  {template.sections.map((section, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded text-sm border text-gray-600"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors text-gray-600"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onApply}
          disabled={!selectedTemplate}
        >
          Apply Template
        </button>
      </div>
    </div>
  );

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Template"
      width="w-[32rem]"
    >
      {modalContent}
    </ModalOverlay>
  );
};

export default TemplateModal;
