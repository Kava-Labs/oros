import { describe, it, expect, vi, Mock } from 'vitest';
import { chat } from './chat';
import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/index';

// Helper functions to create mock chunks
const createContentChunk = (content: string): ChatCompletionChunk => {
  return {
    choices: [{ delta: { content } }],
  } as unknown as ChatCompletionChunk;
};

const createToolCallChunk = (
  toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[],
): ChatCompletionChunk => {
  return {
    choices: [{ delta: { tool_calls: toolCalls } }],
  } as unknown as ChatCompletionChunk;
};

const createFinishChunk = (): ChatCompletionChunk => {
  return {
    choices: [{ finish_reason: 'stop' }],
  } as unknown as ChatCompletionChunk;
};

describe('chat function', () => {
  it('should call onData when content chunks are received', async () => {
    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as OpenAI;

    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield createContentChunk('Hello,');
        yield createContentChunk(' world!');
        yield createFinishChunk();
      },
      controller: {
        abort: vi.fn(),
      },
    };

    (mockOpenAI.chat.completions.create as Mock).mockResolvedValue(mockStream);

    const onData = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();
    const onToolCallRequest = vi.fn();

    const cfg = {
      openAI: mockOpenAI,
      model: 'gpt-4',
      messages: [],
      onData,
      onDone,
      onError,
      onToolCallRequest,
    };

    chat(cfg);

    // Wait until onDone is called
    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    // Verify that onData was called with 'Hello,' and ' world!'
    expect(onData).toHaveBeenCalledWith('Hello,');
    expect(onData).toHaveBeenCalledWith(' world!');

    // Verify that onDone was called
    expect(onDone).toHaveBeenCalled();

    // Verify that onToolCallRequest was not called
    expect(onToolCallRequest).not.toHaveBeenCalled();
  });

  it('should call onToolCallRequest when tool call chunks are received', async () => {
    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as OpenAI;

    // Mock the stream to yield tool call chunks using helper functions
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield createToolCallChunk([
          {
            index: 0,
            id: 'tool_call_id',
            function: {
              name: 'tool_name',
              arguments: '{"arg": "value"',
            },
          },
        ]);
        yield createToolCallChunk([
          {
            index: 0,
            function: {
              arguments: ',"arg2": "value2"}',
            },
          },
        ]);
        yield createFinishChunk();
      },
      controller: {
        abort: vi.fn(),
      },
    };

    (mockOpenAI.chat.completions.create as Mock).mockResolvedValue(mockStream);

    const onData = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();
    const onToolCallRequest = vi.fn();

    const cfg = {
      openAI: mockOpenAI,
      model: 'gpt-4',
      messages: [],
      onData,
      onDone,
      onError,
      onToolCallRequest,
    };

    chat(cfg);
    // wait for onDone
    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    // Verify that onToolCallRequest was called with assembled tool calls
    expect(onToolCallRequest).toHaveBeenCalledWith([
      {
        index: 0,
        id: 'tool_call_id',
        function: {
          name: 'tool_name',
          arguments: '{"arg": "value","arg2": "value2"}',
        },
      },
    ]);

    // Verify that onData was not called
    expect(onData).not.toHaveBeenCalled();

    // Verify that onDone was called
    expect(onDone).toHaveBeenCalled();
  });

  it('should cancel the stream when cancel function is called', async () => {
    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as OpenAI;

    let controllerAbortCalled = false;
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield createContentChunk('Hello,');
        // Wait before yielding the next chunk
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield createContentChunk(' world!');
      },
      controller: {
        abort: () => {
          controllerAbortCalled = true;
        },
      },
    };

    (mockOpenAI.chat.completions.create as Mock).mockResolvedValue(mockStream);

    const onData = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();
    const onToolCallRequest = vi.fn();
    const onCancel = vi.fn();

    const cfg = {
      openAI: mockOpenAI,
      model: 'gpt-4',
      messages: [],
      onData,
      onError,
      onDone,
      onToolCallRequest,
      onCancel,
    };

    const cancel = chat(cfg);

    // Wait a bit and then cancel
    await new Promise((resolve) => setTimeout(resolve, 50));
    cancel();

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify that controller.abort was called
    expect(controllerAbortCalled).toBe(true);

    // Verify that onData was called only once
    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith('Hello,');

    // Verify that onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Verify that onDone was not called
    expect(onDone).not.toHaveBeenCalled();

    // Verify that onToolCallRequest was not called
    expect(onToolCallRequest).not.toHaveBeenCalled();
  });

  // sometimes openAI sends empty content chunks
  // this tests that we can handle that and not call onDone
  it('should handle empty content chunks gracefully', async () => {
    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as OpenAI;

    // Mock the stream to yield an empty content chunk using helper functions
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield createContentChunk('');
        yield createContentChunk('hi');
        yield createFinishChunk();
      },
      controller: {
        abort: vi.fn(),
      },
    };

    (mockOpenAI.chat.completions.create as Mock).mockResolvedValue(mockStream);

    const onData = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();
    const onToolCallRequest = vi.fn();

    const cfg = {
      openAI: mockOpenAI,
      model: 'gpt-4',
      messages: [],
      onData,
      onError,
      onDone,
      onToolCallRequest,
    };

    chat(cfg);

    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    // Verify that onData was called with an empty string
    expect(onData).toHaveBeenCalledWith('');
    expect(onData).toHaveBeenCalledWith('hi');

    // Verify that onDone was called
    expect(onDone).toHaveBeenCalled();

    // Verify that onToolCallRequest was not called
    expect(onToolCallRequest).not.toHaveBeenCalled();
  });

  it('should handle multiple tool calls correctly', async () => {
    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as OpenAI;

    // Mock the stream to yield multiple tool call chunks using helper functions
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        // First tool call chunk
        yield createToolCallChunk([
          {
            index: 0,
            id: 'tool_call_id_1',
            function: {
              name: 'tool_name_1',
              arguments: '{"arg1": "value1"',
            },
          },
        ]);
        // Second tool call chunk
        yield createToolCallChunk([
          {
            index: 1,
            id: 'tool_call_id_2',
            function: {
              name: 'tool_name_2',
              arguments: '{"arg2": "value2"}',
            },
          },
        ]);
        // Finish assembling the first tool call
        yield createToolCallChunk([
          {
            index: 0,
            function: {
              arguments: ',"arg3": "value3"}',
            },
          },
        ]);
        yield createFinishChunk();
      },
      controller: {
        abort: vi.fn(),
      },
    };

    (mockOpenAI.chat.completions.create as Mock).mockResolvedValue(mockStream);

    const onData = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();
    const onToolCallRequest = vi.fn();

    const cfg = {
      openAI: mockOpenAI,
      model: 'gpt-4',
      messages: [],
      onData,
      onError,
      onDone,
      onToolCallRequest,
    };

    chat(cfg);

    await new Promise((resolve) => {
      onDone.mockImplementation(() => {
        resolve(null);
      });
    });

    // Verify that onToolCallRequest was called with assembled tool calls
    expect(onToolCallRequest).toHaveBeenCalledWith([
      {
        index: 0,
        id: 'tool_call_id_1',
        function: {
          name: 'tool_name_1',
          arguments: '{"arg1": "value1","arg3": "value3"}',
        },
      },
      {
        index: 1,
        id: 'tool_call_id_2',
        function: {
          name: 'tool_name_2',
          arguments: '{"arg2": "value2"}',
        },
      },
    ]);

    // Verify that onData was not called
    expect(onData).not.toHaveBeenCalled();

    // Verify that onDone was called
    expect(onDone).toHaveBeenCalled();
  });
});
