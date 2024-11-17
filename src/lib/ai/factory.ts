import { AIProvider, AIProviderType } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { BedrockProvider } from './bedrock-provider';

export class AIProviderFactory {
  static createProvider(type: AIProviderType, config: Record<string, string>): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.modelId);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey);
      case 'bedrock':
        return new BedrockProvider(config.region, config.modelId);
      default:
        throw new Error(`Unsupported AI provider type: ${type}`);
    }
  }
}
