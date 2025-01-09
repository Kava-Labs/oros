import type { ChatCompletionTool } from 'openai/resources/index';
import { ToolFunctions } from '../tools/types';

const isWebappIntegration = import.meta.env['VITE_KAVA_WEBAPP'] === 'true';

export const tools: ChatCompletionTool[] = isWebappIntegration
  ? [
      {
        type: 'function',
        function: {
          name: ToolFunctions.NAVIGATE_TO_PAGE,
          description:
            'navigates to a page (like /balances) so a user can view their positions and possibly take more actions',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'the url of the page to navigate to',
              },
            },
            required: ['url'],
            strict: true,
            additionalProperties: false,
          },
        },
      },
    ]
  : [
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
