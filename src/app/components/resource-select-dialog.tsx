import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Check, Loader2 } from 'lucide-react';
import { Resource } from '@/app/lib/types';

interface ResourceSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resources: Resource[];
  selectedResources: number[];
  onResourceSelect: (resourceId: number) => void;
}

export function ResourceSelectDialog({
  open,
  onOpenChange,
  resources,
  selectedResources,
  onResourceSelect,
}: ResourceSelectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Select Resources</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {resources.length > 0 ? (
            resources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => {
                  if (resource.status === 'completed') {
                    onResourceSelect(resource.id);
                  }
                }}
                disabled={resource.status !== 'completed'}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedResources.includes(resource.id)
                    ? 'bg-blue-50 text-blue-600'
                    : resource.status === 'completed'
                    ? 'hover:bg-gray-100 text-gray-700'
                    : 'opacity-50 cursor-not-allowed text-gray-500'
                }`}
              >
                <FileText size={18} className="flex-shrink-0" />
                <span className="flex-1 truncate">{resource.name}</span>
                {resource.status === 'processing' && (
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                )}
                {resource.status === 'error' && (
                  <span className="text-xs text-red-500">Failed</span>
                )}
                {resource.status === 'completed' && selectedResources.includes(resource.id) && (
                  <Check size={18} className="flex-shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No resources available. Add some resources in the sidebar first.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
