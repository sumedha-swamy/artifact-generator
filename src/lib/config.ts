import { AIProviderType } from './ai/types';

export const AI_PROVIDER = (process.env.AI_PROVIDER as AIProviderType) || 'openai';
export const AI_API_KEY = process.env.AI_API_KEY || ''; 