import { chat } from '../src/utils';
import { createOpenApiClient } from './helpers';
import OpenAI from 'openai';

describe('chat function', () => {
  const onData = vi.fn();
  const onDone = vi.fn();
  const onError = vi.fn();
  const onToolCallRequest = vi.fn();

  it('successfully constructs a streaming text response', async () => {
    const expectedOutput = 'This is an integration test.';

    const openAIClient = createOpenApiClient();

    chat({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "This is an integration test."',
        },
      ],
      onData,
      onDone,
      onError,
      onToolCallRequest,
      openAI: openAIClient,
    });

    //  Wait for the chat completion to finish
    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });
    //  'calls' is an array of the arguments passed to the function
    //  so 'chatStream' is an array of arrays
    const chatStream = onData.mock.calls;

    let output = '';

    chatStream.forEach((stream) => {
      stream.forEach((chunk) => {
        output = output.concat(chunk);
      });
    });

    expect(output).toBe(expectedOutput);
  });

  it('calls onError', async () => {
    chat({
      model: 'gpt-4o-mini',
      messages: [],
      onData,
      onDone,
      onError,
      onToolCallRequest,
      openAI: new OpenAI({
        baseURL: 'foobar',
      }),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(onError).toHaveBeenCalledWith(Error('Invalid URL'));
  });

  it('makes a tool call with the correct parameters', async () => {
    const openAIClient = createOpenApiClient();

    chat({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content:
            'What is the delegated balance of kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq?',
        },
      ],
      tools: [
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
      ],
      onData,
      onDone,
      onError,
      onToolCallRequest,
      openAI: openAIClient,
    });

    //  Wait for the chat completion to finish
    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    const toolCallChunk = onToolCallRequest.mock.calls[0][0];

    expect(toolCallChunk[0].function.name).toBe('getDelegatedBalance');
    expect(toolCallChunk[0].function.arguments).toBe(
      JSON.stringify({
        address: 'kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
      }),
    );
  });
});
