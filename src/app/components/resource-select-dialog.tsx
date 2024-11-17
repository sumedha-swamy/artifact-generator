import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: number;
  name: string;
  path: string;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Resources</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] mt-4">
          <div className="space-y-1 p-1">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={cn(
                  "flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer",
                  selectedResources.includes(resource.id) ? "bg-blue-50" : ""
                )}
                onClick={() => onResourceSelect(resource.id)}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selectedResources.includes(resource.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">{resource.name}</span>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No resources available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
