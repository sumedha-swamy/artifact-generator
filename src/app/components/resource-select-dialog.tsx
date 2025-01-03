import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: number;
  name: string;
  path: string;
  status: 'processing' | 'completed' | 'error';
  selected?: boolean;
}

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
      <DialogContent className="sm:max-w-[425px] bg-white p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Reference Documents</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] overflow-auto px-6 py-4">
          <div className="space-y-1">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md",
                  resource.status === 'completed' 
                    ? "hover:bg-gray-100 cursor-pointer" 
                    : "opacity-50 cursor-not-allowed",
                  selectedResources.includes(resource.id) && "bg-blue-50"
                )}
                onClick={() => {
                  if (resource.status === 'completed') {
                    onResourceSelect(resource.id);
                  }
                }}
              >
                <div className="flex-shrink-0">
                  {resource.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : resource.status === 'completed' ? (
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedResources.includes(resource.id) 
                          ? "text-blue-600" 
                          : "text-gray-300"
                      )}
                    />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-100" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {resource.name}
                    </span>
                    {resource.status === 'processing' && (
                      <span className="text-xs text-blue-600">Processing...</span>
                    )}
                    {resource.status === 'error' && (
                      <span className="text-xs text-red-600">Failed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                No resources available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
