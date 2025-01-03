// src/components/source-select.tsx
import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const sourceOptions = [
  { value: "all", label: "All documents" },
  { value: "selected", label: "Selected documents" },
] as const;

interface SourceSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceSelect({ value: propValue, onChange }: SourceSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(propValue || "all");

  React.useEffect(() => {
    if (propValue !== value) {
      setValue(propValue);
    }
  }, [propValue]);

  const currentValue = sourceOptions.find((option) => option.value === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        Reference Documents
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between bg-white border-gray-300 text-gray-900"
          >
            {currentValue?.label ?? "Select documents"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-white shadow-lg border border-gray-200">
          <div className="rounded-md">
            {sourceOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                  "hover:bg-gray-100",
                  value === option.value && "bg-blue-50 text-blue-600"
                )}
                onClick={() => {
                  setValue(option.value);
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}