import { ChatCompletionTool } from 'openai/resources/index';

export interface BaseModelConfig {
  name: string;
  description: string;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
}

export type ReasoningModelConfig = BaseModelConfig;
