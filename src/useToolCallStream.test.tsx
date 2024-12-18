// useToolCallStream.test.ts
import { renderHook, act } from '@testing-library/react';
import { useToolCallStream } from './useToolCallStream';
import { ToolCallStore } from './toolCallStore';

// Test Suite
describe('useToolCallStream', () => {
  let toolCallStore: ToolCallStore;

  beforeEach(() => {
    toolCallStore = new ToolCallStore();
  });

  it('should parse a valid JSON input with all keys', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    act(() => {
      toolCallStore.pushToolCall({
        id: 'dsafdas',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual(data);
  });

  it('should parse a valid JSON input with all keys streamed one character at a time', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    const str = JSON.stringify(data, null, 2);

    act(() => {
      toolCallStore.pushToolCall({
        id: 'sacdsfgregv',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: str[0],
        },
      });
    });

    for (let i = 1; i < str.length; i++) {
      act(() => {
        const newData = {
          ...toolCallStore.getSnapshot()[0],
        };
        newData.function!.arguments += str[i];
        toolCallStore.setToolCalls([newData]);
      });
    }

    expect(result.current).toEqual(data);
  });

  it('should handle JSON input with extra spaces', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const data = {
      prompt: 'Test prompt',
      symbol: 'ETH',
      name: 'Ethereum',
      about: 'Smart contract platform',
    };

    act(() => {
      toolCallStore.pushToolCall({
        id: 'er23fdfdf',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data, null, 2),
        },
      });
    });

    expect(result.current).toEqual(data);
  });

  it('should handle missing keys gracefully', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    act(() => {
      toolCallStore.pushToolCall({
        id: 'qe32r3f',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify({ prompt: 'Test prompt', symbol: 'BTC' }),
        },
      });
    });

    expect(result.current).toEqual({
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: '',
      about: '',
    });
  });

  it('should reset state when no tool calls exist', () => {
    const { result, rerender } = renderHook(() =>
      useToolCallStream(toolCallStore),
    );

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    act(() => {
      toolCallStore.pushToolCall({
        id: 'x3g4f',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual(data);

    act(() => {
      toolCallStore.setToolCalls([]);
    });

    rerender();

    expect(result.current).toEqual({
      prompt: '',
      symbol: '',
      name: '',
      about: '',
    });
  });

  it('should handle escaped quotes in values', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const dataStr =
      '{"prompt":"Test \\"prompt\\"","symbol":"BTC","name":"Bitcoin","about":"A decentralized currency"}';
    const data = JSON.parse(dataStr);

    act(() => {
      toolCallStore.pushToolCall({
        id: '321edfedfdfvf',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: dataStr,
        },
      });
    });

    expect(result.current).toEqual(data);
  });

  it('should handle multi escaped quotes in values with stream', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const dataStr =
      '{"prompt":"Test \\"prompt\\"","symbol":"\\"BTC\\"","name":"\\"Bitcoin\\"","about":"\\"A decentralized currency\\""}';

    const data = JSON.parse(dataStr);

    act(() => {
      toolCallStore.pushToolCall({
        id: '22141ccsa',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: dataStr[0],
        },
      });
    });

    for (let i = 1; i < dataStr.length; i++) {
      act(() => {
        const newData = { ...toolCallStore.getSnapshot()[0] };
        newData.function!.arguments += dataStr[i];
        toolCallStore.setToolCalls([newData]);
      });
    }

    expect(result.current).toEqual(data);
  });

  it('should skip unrelated tool calls', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    const data = {
      prompt: 'Valid prompt',
      symbol: 'DOGE',
      name: 'Dogecoin',
      about: 'A meme coin',
    };

    act(() => {
      toolCallStore.pushToolCall({
        id: '432cvfdvrb',
        index: 0,
        function: {
          name: 'unrelatedFunction',
          arguments: `"prompt":"Ignored","symbol":"None"`,
        },
      });

      toolCallStore.pushToolCall({
        id: '321fwsd',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual(data);
  });

  it('should handle null or empty input arguments', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    act(() => {
      toolCallStore.pushToolCall({
        id: 'e122dcsd',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: '',
        },
      });
    });

    expect(result.current).toEqual({
      prompt: '',
      symbol: '',
      name: '',
      about: '',
    });

    act(() => {
      toolCallStore.pushToolCall({
        id: 'fsdvcxvdfvdf',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: null as unknown as string,
        },
      });
    });

    expect(result.current).toEqual({
      prompt: '',
      symbol: '',
      name: '',
      about: '',
    });
  });
});
