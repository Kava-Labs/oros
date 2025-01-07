import type { ChatCompletionTool } from 'openai/resources/index';
import { ToolFunctions } from '../tools/types';

export const memeCoinTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: ToolFunctions.GENERATE_COIN_METADATA,
      description:
        'generates a coin image, along with the symbol and token description',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'the name of the token',
          },
          symbol: {
            type: 'string',
            description: 'the token symbol',
          },
          about: {
            type: 'string',
            description: 'the description of the token',
          },
          prompt: {
            type: 'string',
            description:
              'A text description of the desired coin image optimized for dalle use the conversation context to help make the image',
          },
        },
        required: ['name', 'symbol', 'about', 'prompt'],
        strict: true,
        additionalProperties: false,
      },
    },
  },
];
