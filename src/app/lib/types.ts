import { LucideIcon } from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  content: string;
  purpose: string;
  strength: number;
  isEditing: boolean;
  isGenerating: boolean;
  selectedSources: string[];
  instructions: string;
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