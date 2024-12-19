import { renderHook, act } from '@testing-library/react';
import { useToolCallStreams } from './useToolCallStreams';
import { ToolCallStore } from './toolCallStore';

describe('useToolCallStreams', () => {
  let toolCallStore: ToolCallStore;

  beforeEach(() => {
    toolCallStore = new ToolCallStore();
  });

  it('should parse a valid JSON input', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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

  it('should parse a valid JSON input  streamed one character at a time', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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

  it('should handle multi tool calls', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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
        index: 1,
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

  it('should handle multiple interleaved tool calls being streamed', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

    const data1 = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    const data2 = {
      prompt: 'Test prompt',
      symbol: 'UST',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    const str1 = JSON.stringify(data1, null, 2);
    const str2 = JSON.stringify(data2, null, 2);

    act(() => {
      toolCallStore.pushToolCall({
        id: 'sacdsfgregv',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: str1[0],
        },
      });
    });

    act(() => {
      toolCallStore.pushToolCall({
        id: 'sacdsfgregx',
        index: 1,
        function: {
          name: 'generateCoinMetadata',
          arguments: str2[0],
        },
      });
    });
    expect(toolCallStore.getSnapshot()).toHaveLength(2);
    const len = Math.max(str1.length, str2.length);
    for (let i = 1; i < len; i++) {
      act(() => {
        const newData = [
          {
            ...toolCallStore.getSnapshot()[0],
          },
          {
            ...toolCallStore.getSnapshot()[1],
          },
        ];

        if (i < str1.length) newData[0].function!.arguments += str1[i];
        if (i < str2.length) newData[1].function!.arguments += str2[i];
        toolCallStore.setToolCalls(newData);
      });
    }

    expect(result.current).toStrictEqual([
      {
        id: 'sacdsfgregv',
        name: 'generateCoinMetadata',
        arguments: data1,
      },
      {
        id: 'sacdsfgregx',
        name: 'generateCoinMetadata',
        arguments: data2,
      },
    ]);
  });

  it('should work with any arbitrary arguments', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

    const data = {
      'key': 'val', 
      'nested': {
        'key': 'val'
      }
    };

    act(() => {
      toolCallStore.pushToolCall({
        id: 'dsafdasxr',
        index: 0,
        function: {
          name: 'someOtherToolCall',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual([
      { id: 'dsafdasxr', name: 'someOtherToolCall', arguments: data },
    ]);
  });

  it('should reset state when no tool calls exist', () => {
    const { result, rerender } = renderHook(() =>
      useToolCallStreams(toolCallStore),
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
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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

  it('should handle invalid json gracefully', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStore));

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
