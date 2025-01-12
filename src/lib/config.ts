import { AIProviderType } from './ai/types';

export const AI_PROVIDER = (process.env.AI_PROVIDER as AIProviderType);

// Get the appropriate API key based on provider
export const AI_API_KEY = (() => {
  switch (AI_PROVIDER) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'bedrock':
      return ''; // Bedrock uses AWS credentials
    default:
      return '';
  }
})(); 