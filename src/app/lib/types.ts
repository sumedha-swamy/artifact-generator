import { LucideIcon } from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  content: string;
  description: string;
  strength: number;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: string[];
  sourceOption: string;
  revisions: Array<{ content: string; description: string }>;
  currentRevisionIndex?: number;
}



export interface Template {
  id: number;
  name: string;
  description: string;
  sections: string[];
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'green';
}

export interface Source {
  id: number;
  type: string;
  name: string;
  references?: number;
  icon?: LucideIcon;
}

export interface Resource {
  id: number;
  name: string;
  path: string;
  selected?: boolean;
}
