// src/components/source-select.tsx
import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const sourceOptions = [
  { value: "selected", label: "Selected Resources" },
  { value: "all", label: "All Sidebar Resources" },
  { value: "model", label: "Web & All Resources" },
] as const;

interface SourceSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceSelect({ value, onChange }: SourceSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const currentValue = sourceOptions.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between text-sm"
        >
          {currentValue?.label ?? "Select source..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="border rounded-md">
          <input
            className="w-full px-3 py-2 text-sm border-b"
            placeholder="Search source..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <div className="max-h-[300px] overflow-auto p-1">
            {sourceOptions
              .filter(option =>
                option.label.toLowerCase().includes(searchValue.toLowerCase())
              )
              .map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
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
            {sourceOptions.filter(option =>
              option.label.toLowerCase().includes(searchValue.toLowerCase())
            ).length === 0 && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No results found.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}