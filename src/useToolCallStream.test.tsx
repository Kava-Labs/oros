import { renderHook, act } from '@testing-library/react';
import { useToolCallStream } from './useToolCallStream';
import { ToolCallStore } from './toolCallStore';

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

    expect(result.current).toEqual([
      { id: 'dsafdas', name: 'generateCoinMetadata', arguments: data },
    ]);
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

    expect(result.current).toEqual([
      {
        id: 'sacdsfgregv',
        name: 'generateCoinMetadata',
        arguments: data,
      },
    ]);
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

    expect(result.current).toEqual([
      {
        id: 'er23fdfdf',
        name: 'generateCoinMetadata',
        arguments: data,
      },
    ]);
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

    expect(result.current).toEqual([
      {
        id: 'qe32r3f',
        name: 'generateCoinMetadata',
        arguments: {
          prompt: 'Test prompt',
          symbol: 'BTC',
        },
      },
    ]);
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

    expect(result.current).toEqual([
      { id: 'x3g4f', name: 'generateCoinMetadata', arguments: data },
    ]);

    act(() => {
      toolCallStore.setToolCalls([]);
    });

    rerender();

    expect(result.current).toEqual([]);
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

    expect(result.current).toEqual([
      {
        id: '321edfedfdfvf',
        name: 'generateCoinMetadata',
        arguments: data,
      },
    ]);
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

    expect(result.current).toEqual([
      {
        id: '22141ccsa',
        name: 'generateCoinMetadata',
        arguments: data,
      },
    ]);
  });

  it('should handle multi tool calls', () => {
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
          arguments: JSON.stringify({ hi: 'there' }),
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

    expect(result.current).toEqual([
      {
        id: '432cvfdvrb',
        name: 'unrelatedFunction',
        arguments: { hi: 'there' },
      },
      {
        id: '321fwsd',
        name: 'generateCoinMetadata',
        arguments: data,
      },
    ]);
  });

  it('should handle invalid json gracefully', () => {
    const { result } = renderHook(() => useToolCallStream(toolCallStore));

    act(() => {
      toolCallStore.pushToolCall({
        id: 'edsvdsfvdf2r23r',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: '{ some bad json ][',
        },
      });
    });

    expect(result.current).toEqual([]);
  });
});
