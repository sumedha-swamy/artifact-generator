import { LucideIcon } from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  description: string;
  content: string;
  strength: number;
  isEditing?: boolean;
  isGenerating?: boolean;
  sourceOption?: string;
  selectedSources: string[];
  temperature?: number;
  estimatedLength?: string;
  revisions?: Array<{
    content: string;
    description: string;
  }>;
  keyPoints?: string[];
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
  status: 'processing' | 'completed' | 'error';
}
