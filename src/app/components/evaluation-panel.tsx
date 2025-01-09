import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { EvaluationResult } from '@/lib/ai/types';

interface EvaluationPanelProps {
  sections: Array<any>;
  documentTitle: string;
  documentPurpose: string;
  onEvaluate: () => Promise<void>;
  onApplyImprovements: () => Promise<void>;
  isEvaluating: boolean;
  isApplyingImprovements: boolean;
  evaluationResult: EvaluationResult | null;
}

const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  sections,
  documentTitle,
  documentPurpose,
  onEvaluate,
  onApplyImprovements,
  isEvaluating,
  isApplyingImprovements,
  evaluationResult
}) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Document Evaluation</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Always show the evaluate button */}
        <div className="space-y-4 mb-6">
          {!evaluationResult && (
            <p className="text-gray-600">
              Click the button below to evaluate your document's quality and get improvement suggestions.
            </p>
          )}
          <button
            onClick={onEvaluate}
            disabled={isEvaluating}
            className={`w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
              hover:bg-blue-700 flex items-center justify-center gap-2 
              ${isEvaluating ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isEvaluating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Evaluating...
              </>
            ) : (
              <>
                <ClipboardCheck size={16} />
                {evaluationResult ? 'Re-evaluate Document' : 'Evaluate Document'}
              </>
            )}
          </button>
        </div>

        {/* Show results if available */}
        {evaluationResult && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-blue-600">
                {evaluationResult.overallScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Score</div>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(evaluationResult.categories).map(([category, score]) => (
                <div key={category} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-lg font-semibold text-gray-900">{score}</div>
                  <div className="text-xs text-gray-600 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>

            {/* Improvements */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Suggested Improvements</h4>
              <ul className="space-y-2">
                {evaluationResult.improvements.map((improvement, index) => (
                  <li key={index} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-amber-500">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Detailed Analysis</h4>
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200">
                <ReactMarkdown>{evaluationResult.detailedFeedback}</ReactMarkdown>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onApplyImprovements}
                disabled={isApplyingImprovements}
                className={`w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg 
                  hover:bg-green-700 flex items-center justify-center gap-2 
                  ${isApplyingImprovements ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isApplyingImprovements ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying Improvements...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Apply Improvements
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPanel; 