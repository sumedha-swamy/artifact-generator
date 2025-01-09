import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Wand2 } from 'lucide-react';

interface PlanningSidebarProps {
  plan: string;
  isVisible: boolean;
  onToggle: () => void;
  onFeedback: (feedback: string) => Promise<void>;
  onFinalize: () => Promise<void>;
  isProcessing: boolean;
  isPlanFinalized: boolean;
  onReset?: () => void;
}

const PlanningSidebar: React.FC<PlanningSidebarProps> = ({
  plan,
  isVisible,
  onToggle,
  onFeedback,
  onFinalize,
  isProcessing,
  isPlanFinalized,
  onReset
}) => {
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<Array<{ type: 'plan' | 'feedback' | 'system', content: string }>>([]);

  React.useEffect(() => {
    if (plan) {
      setHistory(prev => [...prev, { type: 'plan', content: plan }]);
    }
  }, [plan]);

  const handleFeedback = async () => {
    setHistory(prev => [...prev, { type: 'feedback', content: feedback }]);
    await onFeedback(feedback);
    setFeedback('');
  };

  const handleFinalize = async () => {
    await onFinalize();
    setHistory(prev => [
      ...prev, 
      { type: 'system', content: '✅ Plan finalized! Now generating detailed section descriptions...' }
    ]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Document Plan</h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!plan ? (
          // Initial state - no plan yet
          <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Wand2 size={24} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                Ready to Create Your Document
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Enter your document's title and purpose above, then click "Plan" to start generating an intelligent document structure.
              </p>
            </div>
          </div>
        ) : (
          // Plan exists - show chat interface
          <div className="p-4 space-y-4">
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className={`rounded-lg shadow-sm ${
                  item.type === 'feedback' ? 'bg-gray-50 border border-gray-200' : 
                  item.type === 'system' ? 'bg-blue-50 border border-blue-100' : 
                  'bg-white border border-gray-200'
                }`}>
                  <div className="px-3 py-2 border-b border-gray-200 text-xs text-gray-600">
                    {item.type === 'feedback' ? 'Your Feedback:' : 
                     item.type === 'system' ? 'System Message:' : 
                     'AI Plan:'}
                  </div>
                  <div className="p-3 prose prose-sm max-w-none">
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            {isPlanFinalized ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                Plan finalized! Review and edit the section descriptions to customize your plan. When you're satisfied, click "Generate" to create content for all sections.
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <textarea
                    className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Provide feedback to refine the plan..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${
                      isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    onClick={handleFeedback}
                    disabled={isProcessing || !feedback}
                  >
                    {isProcessing && <span className="animate-spin">↻</span>}
                    Refine Plan
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 ${
                      isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    onClick={handleFinalize}
                    disabled={isProcessing}
                  >
                    {isProcessing && <span className="animate-spin">↻</span>}
                    Finalize Plan
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningSidebar; 