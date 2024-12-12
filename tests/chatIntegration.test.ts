import { chat } from '../src/utils';
import { createOpenApiClient } from './helpers';

describe('chat function', () => {
  const onData = vi.fn();
  const onDone = vi.fn();
  const onError = vi.fn();
  const onToolCallRequest = vi.fn();

  it('successfully constructs a streaming response', async () => {
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
    await new Promise((resolve) => setTimeout(resolve, 500));

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
});
