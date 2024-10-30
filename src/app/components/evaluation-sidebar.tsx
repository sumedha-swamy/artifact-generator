'use client';

import React from 'react';
import { AlertCircle, FileText, Link } from 'lucide-react';

interface EvaluationSidebarProps {
  documentStrength: number;
  activeSources: Array<{
    id: number;
    type: string;
    name: string;
    references: number;
  }>;
  suggestions: string[];
}

const EvaluationSidebar: React.FC<EvaluationSidebarProps> = ({ 
  documentStrength = 85, 
  activeSources = [], 
  suggestions = [] 
}) => {
  return (
    <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
       <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Evaluation</h2>
      <div className="space-y-6">
        {/* Strength Meter */}
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Overall Strength</h3>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${documentStrength}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {documentStrength}%</span>
              <span>{documentStrength >= 80 ? 'Excellent' : documentStrength >= 60 ? 'Good' : 'Needs Work'}</span>
            </div>
          </div>
        </div>
        
        {/* Active Sources */}
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Active Sources</h3>
          <div className="space-y-2">
            {activeSources.map((source) => (
              <div 
                key={source.id}
                className="flex items-center justify-between p-2 bg-gray-50 
                          rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  {source.type === 'document' ? (
                    <FileText size={16} className="text-gray-600" />
                  ) : (
                    <Link size={16} className="text-gray-600" />
                  )}
                  <span className="text-gray-700">{source.name}</span>
                </div>
                <span className="text-blue-600">{source.references} refs</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Usage Statistics */}
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Usage Statistics</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-2xl font-semibold text-gray-700">{activeSources.length}</div>
              <div className="text-sm text-gray-600">Sources Used</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-2xl font-semibold text-gray-700">
                {activeSources.reduce((acc, src) => acc + src.references, 0)}
              </div>
              <div className="text-sm text-gray-600">Total References</div>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h3 className="font-medium mb-2 text-gray-800">Improvement Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="p-3 bg-blue-50 rounded-lg border border-blue-100 
                          text-blue-800 text-sm"
              >
                <AlertCircle className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-blue-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationSidebar;