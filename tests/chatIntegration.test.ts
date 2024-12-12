import { chat } from '../src/utils';
import { createOpenApiClient } from './helpers';
import OpenAI from 'openai';
import { ChatConfig } from '../src/utils/chat/chat';

describe('chat function', () => {
  const onData = vi.fn();
  const onDone = vi.fn();
  const onError = vi.fn();
  const onToolCallRequest = vi.fn();

  const openAIClient = createOpenApiClient();

  const chatConfig: ChatConfig = {
    model: 'gpt-4o-mini',
    messages: [],
    onData,
    onDone,
    onError,
    onToolCallRequest,
    openAI: openAIClient,
  };

  it("successfully constructs a streaming text response to a user's message", async () => {
    chat({
      ...chatConfig,
      messages: [
        {
          role: 'user',
          content: 'Say "This is an integration test"',
        },
      ],
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

    expect(output).toMatch(/This is an integration test/i);
  });

  it('calls onError with misconfigured proxy', async () => {
    chat({
      ...chatConfig,
      openAI: new OpenAI({
        baseURL: 'foobar',
      }),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(onError).toHaveBeenCalledWith(Error('Invalid URL'));
  });

  it('makes a tool call with the correct parameters', async () => {
    const kavaAddress = 'kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq';

    chat({
      ...chatConfig,
      messages: [
        {
          role: 'user',
          content: `What is the delegated balance of ${kavaAddress}?`,
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
    });

    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    const toolCallChunk = onToolCallRequest.mock.calls[0][0];

    expect(toolCallChunk[0].function.name).toBe('getDelegatedBalance');
    expect(toolCallChunk[0].function.arguments).toBe(
      JSON.stringify({
        address: kavaAddress,
      }),
    );
  });
});
