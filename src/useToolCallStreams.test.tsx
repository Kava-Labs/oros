import { renderHook, act } from '@testing-library/react';
import { useToolCallStreams } from './useToolCallStreams';
import { ToolCallStreamStore } from './toolCallStreamStore';

describe('useToolCallStreams', () => {
  let toolCallStreamStore: ToolCallStreamStore;

  beforeEach(() => {
    toolCallStreamStore = new ToolCallStreamStore();
  });

  it('should parse a valid JSON input', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    act(() => {
      toolCallStreamStore.pushToolCall({
        id: 'dsafdas',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual([
      { id: 'dsafdas', name: 'generateCoinMetadata', argumentsStream: data },
    ]);
  });

  it('should parse a valid JSON input  streamed one character at a time', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    const str = JSON.stringify(data, null, 2);

    act(() => {
      toolCallStreamStore.pushToolCall({
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
          ...toolCallStreamStore.getSnapshot()[0],
        };
        newData.function!.arguments += str[i];
        toolCallStreamStore.setToolCalls([newData]);
      });
    }

    expect(result.current).toEqual([
      {
        id: 'sacdsfgregv',
        name: 'generateCoinMetadata',
        argumentsStream: data,
      },
    ]);
  });

  it('should handle multi tool calls', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const data = {
      prompt: 'Valid prompt',
      symbol: 'DOGE',
      name: 'Dogecoin',
      about: 'A meme coin',
    };

    act(() => {
      toolCallStreamStore.pushToolCall({
        id: '432cvfdvrb',
        index: 0,
        function: {
          name: 'unrelatedFunction',
          arguments: JSON.stringify({ hi: 'there' }),
        },
      });

      toolCallStreamStore.pushToolCall({
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
        argumentsStream: { hi: 'there' },
      },
      {
        id: '321fwsd',
        name: 'generateCoinMetadata',
        argumentsStream: data,
      },
    ]);
  });

  it('should handle multiple interleaved tool calls being streamed', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

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
      toolCallStreamStore.pushToolCall({
        id: 'sacdsfgregv',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: str1[0],
        },
      });
    });

    act(() => {
      toolCallStreamStore.pushToolCall({
        id: 'sacdsfgregx',
        index: 1,
        function: {
          name: 'generateCoinMetadata',
          arguments: str2[0],
        },
      });
    });
    expect(toolCallStreamStore.getSnapshot()).toHaveLength(2);
    const len = Math.max(str1.length, str2.length);
    for (let i = 1; i < len; i++) {
      act(() => {
        const newData = [
          {
            ...toolCallStreamStore.getSnapshot()[0],
          },
          {
            ...toolCallStreamStore.getSnapshot()[1],
          },
        ];

        if (i < str1.length) newData[0].function!.arguments += str1[i];
        if (i < str2.length) newData[1].function!.arguments += str2[i];
        toolCallStreamStore.setToolCalls(newData);
      });
    }

    expect(result.current).toStrictEqual([
      {
        id: 'sacdsfgregv',
        name: 'generateCoinMetadata',
        argumentsStream: data1,
      },
      {
        id: 'sacdsfgregx',
        name: 'generateCoinMetadata',
        argumentsStream: data2,
      },
    ]);
  });

  it('should work with any arbitrary arguments', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const data = {
      key: 'val',
      nested: {
        key: 'val',
      },
    };

    act(() => {
      toolCallStreamStore.pushToolCall({
        id: 'dsafdasxr',
        index: 0,
        function: {
          name: 'someOtherToolCall',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual([
      { id: 'dsafdasxr', name: 'someOtherToolCall', argumentsStream: data },
    ]);
  });

  it('should reset state when no tool calls exist', () => {
    const { result, rerender } = renderHook(() =>
      useToolCallStreams(toolCallStreamStore),
    );

    const data = {
      prompt: 'Test prompt',
      symbol: 'BTC',
      name: 'Bitcoin',
      about: 'A decentralized currency',
    };

    act(() => {
      toolCallStreamStore.pushToolCall({
        id: 'x3g4f',
        index: 0,
        function: {
          name: 'generateCoinMetadata',
          arguments: JSON.stringify(data),
        },
      });
    });

    expect(result.current).toEqual([
      { id: 'x3g4f', name: 'generateCoinMetadata', argumentsStream: data },
    ]);

    act(() => {
      toolCallStreamStore.setToolCalls([]);
    });

    rerender();

    expect(result.current).toEqual([]);
  });

  it('should handle escaped quotes in values', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const dataStr =
      '{"prompt":"Test \\"prompt\\"","symbol":"BTC","name":"Bitcoin","about":"A decentralized currency"}';
    const data = JSON.parse(dataStr);

    act(() => {
      toolCallStreamStore.pushToolCall({
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
        argumentsStream: data,
      },
    ]);
  });

  it('should handle multi escaped quotes in values with stream', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    const dataStr =
      '{"prompt":"Test \\"prompt\\"","symbol":"\\"BTC\\"","name":"\\"Bitcoin\\"","about":"\\"A decentralized currency\\""}';

    const data = JSON.parse(dataStr);

    act(() => {
      toolCallStreamStore.pushToolCall({
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
        const newData = { ...toolCallStreamStore.getSnapshot()[0] };
        newData.function!.arguments += dataStr[i];
        toolCallStreamStore.setToolCalls([newData]);
      });
    }

    expect(result.current).toEqual([
      {
        id: '22141ccsa',
        name: 'generateCoinMetadata',
        argumentsStream: data,
      },
    ]);
  });

  it('should handle invalid json gracefully', () => {
    const { result } = renderHook(() => useToolCallStreams(toolCallStreamStore));

    act(() => {
      toolCallStreamStore.pushToolCall({
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
