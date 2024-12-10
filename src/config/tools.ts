import type { ChatCompletionTool } from 'openai/resources/index';

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getAccountBalances',
      description: 'Gets The Account Balances for a Kava Chain User',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The account address to fetch the balances for',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transferAsset',
      description: 'Transfers a token from one address to another address',
      parameters: {
        type: 'object',
        properties: {
          assetName: {
            type: 'string',
            description: 'The name of the token to be transferred',
            enum: ['KAVA', 'USDT', 'WHARD', 'WKAVA'],
          },
          senderAddress: {
            type: 'string',
            description: 'The address sending the token',
          },
          receiverAddress: {
            type: 'string',
            description: 'The address receiving the token',
          },
          amount: {
            type: 'number',
            description: 'The amount to send',
          },
        },
        required: ['assetName', 'senderAddress', 'receiverAddress', 'amount'],
        strict: true,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDisplayStakingApy',
      description:
        'Fetches the raw staking apy value from a JSON api and converts it to a human-readable string with percent sign. An example would be converting 0.01234 into 1.234%',
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDelegatedBalance',
      description:
        'Gets to total delegated (or total staked) balance for an address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description:
              'The account address to fetch the delegated balances for',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generateImage',
      description: 'generates an image from the given prompt',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description:
              'A text description of the desired image optimized for dalle-2 use the conversation context to help make the image, maximum 1000 characters',
          },
        },
        required: ['prompt'],
        strict: true,
      },
    },
  },
];
