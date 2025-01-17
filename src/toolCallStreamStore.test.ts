import { describe, it, expect, vi } from 'vitest';
import { ToolCallStreamStore } from './toolCallStreamStore';
import type { ChatCompletionChunk } from 'openai/resources/index';
import { JSONParser } from '@streamparser/json';

type ToolCall = ChatCompletionChunk.Choice.Delta.ToolCall;

describe('ToolCallStreamStore', () => {
  it('should work with strings, numbers, null, booleans, key value objects, arrays, and deeply nested objects', () => {
    const testCases = [
      'test json string', // string
      100000000, // number
      null, // null
      true, // booleans
      false, // booleans
      {
        key: 'value', // object
      },
      {
        abc: 'def',
        name: 'oros',
        bd: { nested: 'efg', deeper: { more: [1, 2, 3] } },
      }, // nested object
      {
        nested: [1, 2, 3, { obj: 'val' }],
        hello: 'oros', // nested object
      },

      ['abc', 'def', 'efg'], // arrays
    ];
    const testTable = testCases.map((testCase) => ({
      obj: testCase,
      stringified: JSON.stringify(testCase),
    }));

    testTable.forEach((testCase) => {
      const store = new ToolCallStreamStore();

      const { obj, stringified } = testCase;
      const firstChunk: ToolCall = {
        id: 'toolCall-1',
        index: 0,
        function: {
          name: 'myFunction',
        },
      };

      store.setToolCall(firstChunk);

      for (const char of stringified) {
        store.setToolCall({
          index: 0,
          function: { arguments: char },
        });
      }

      const snapshot = store.getSnapShot();
      expect(snapshot).toHaveLength(1);
      expect(snapshot[0].id).toBe('toolCall-1');
      expect(snapshot[0].function.name).toBe('myFunction');
      expect(snapshot[0].function.arguments).toEqual(obj);
    });
  });

  it('should initialize a new tool call and incrementally parse JSON stream', () => {
    const store = new ToolCallStreamStore();
    const jsonArgObj = { a: 'bcd' };
    const jsonArgStr = JSON.stringify(jsonArgObj);

    const firstChunk: ToolCall = {
      id: 'toolCall-1',
      index: 0,
      function: {
        name: 'myFunction',
      },
    };

    store.setToolCall(firstChunk);

    // Let's simulate partial JSON by taking just the first '{ 'a': 'b'
    const firstPart = jsonArgStr.slice(0, 7);
    // notice that even if subsequent chunks only include index
    // and function arguments it should still work
    store.setToolCall({
      index: 0,
      function: { arguments: firstPart },
    });

    const snapshot = store.getSnapShot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].id).toBe('toolCall-1');
    expect(snapshot[0].function.name).toBe('myFunction');
    expect(snapshot[0].function.partial).toBe(true);
    expect(snapshot[0].function.arguments).toEqual({ a: 'b' }); // only that part should be consumable
  });

  it('should handle multiple tool calls streaming concurrently', () => {
    const store = new ToolCallStreamStore();
    const jsonA = JSON.stringify({ argA: 1, argA2: 2 }); // '{"argA":1,"argA2":2}'
    const jsonB = JSON.stringify({ argB: 'test', argB2: true }); // '{"argB":"test","argB2":true}'

    // Split JSON A into parts
    const aPart1 = jsonA.slice(0, 1); // "{"
    const aPart2 = jsonA.slice(1, -1); // '"argA":1,"argA2":2'
    const aPart3 = jsonA.slice(-1); // "}"

    // Split JSON B into parts
    const bPart1 = jsonB.slice(0, 1); // "{"
    const bPart2 = jsonB.slice(1, -1); // '"argB":"test","argB2":true'
    const bPart3 = jsonB.slice(-1); // "}"

    // Start two different tool calls
    store.setToolCall({
      id: 'toolCall-3a',
      index: 0,
      function: { name: 'funcA', arguments: aPart1 },
    });
    store.setToolCall({
      id: 'toolCall-3b',
      index: 1,
      function: { name: 'funcB', arguments: bPart1 },
    });

    // Interleave chunks for both calls
    store.setToolCall({
      id: 'toolCall-3a',
      index: 0,
      function: { arguments: aPart2 },
    });
    store.setToolCall({
      id: 'toolCall-3b',
      index: 1,
      function: { arguments: bPart2 },
    });
    store.setToolCall({
      id: 'toolCall-3a',
      index: 0,
      function: { arguments: aPart3 },
    });
    store.setToolCall({
      id: 'toolCall-3b',
      index: 1,
      function: { arguments: bPart3 },
    });

    const snapshot = store.getSnapShot();

    // ToolCall 3a
    const call3a = snapshot.find((c) => c.id === 'toolCall-3a');
    expect(call3a).toBeDefined();
    expect(call3a!.function.arguments).toEqual({ argA: 1, argA2: 2 });
    expect(call3a!.function.partial).toBeUndefined();

    // ToolCall 3b
    const call3b = snapshot.find((c) => c.id === 'toolCall-3b');
    expect(call3b).toBeDefined();
    expect(call3b!.function.arguments).toEqual({ argB: 'test', argB2: true });
    expect(call3b!.function.partial).toBeUndefined();
  });

  it('should throw when provided with invalid JSON', () => {
    const store = new ToolCallStreamStore();

    store.setToolCall({
      id: 'toolCall-4',
      index: 0,
      function: { name: 'badJSONFunc', arguments: '' },
    });

    expect(() =>
      store.setToolCall({
        index: 0,
        function: { arguments: '[bad' },
      }),
    ).toThrow();
  });

  it('should remove a tool call and its parser when deleteToolCallById is called', () => {
    const store = new ToolCallStreamStore();
    const jsonArgObj = { arg: 'val' };
    const jsonArgStr = JSON.stringify(jsonArgObj);

    store.setToolCall({
      id: 'toolCall-5',
      index: 2,
      function: { name: 'removableFunc', arguments: jsonArgStr },
    });

    const deleted = store.deleteToolCallById('toolCall-5');
    expect(deleted).toBe(true);
    expect(store.getSnapShot()).toEqual([]);

    // Deleting non-existing should return false
    expect(store.deleteToolCallById('non-existent')).toBe(false);
  });

  it('should convert a finished ToolCallStream to ChatCompletionMessageToolCall correctly', () => {
    const store = new ToolCallStreamStore();
    const jsonArgObj = { finalArg: 123 };
    const jsonArgStr = JSON.stringify(jsonArgObj);

    store.setToolCall({
      id: 'toolCall-6',
      index: 3,
      function: { name: 'finalFunc', arguments: jsonArgStr },
    });
    const snapshot = store.getSnapShot();
    const finalToolCall = snapshot[0];
    const apiFormat = store.toChatCompletionMessageToolCall(finalToolCall);
    expect(apiFormat.id).toBe('toolCall-6');
    expect(apiFormat.type).toBe('function');
    expect(apiFormat.function.name).toBe('finalFunc');
    expect(apiFormat.function.arguments).toBe(
      JSON.stringify({ finalArg: 123 }),
    );
  });

  it('should call subscribers on changes', () => {
    const store = new ToolCallStreamStore();
    const callback = vi.fn();
    const unsubscribe = store.subscribe(callback);

    const jsonArgObj = { msg: 'hello' };
    const jsonArgStr = JSON.stringify(jsonArgObj);
    // We'll stream it in two parts
    const part1 = jsonArgStr.slice(0, -1);
    const part2 = jsonArgStr.slice(-1);
    store.setToolCall({
      id: 'toolCall-7',
      index: 4,
      function: { name: 'notifyFunc', arguments: '' },
    });

    expect(callback).toHaveBeenCalledTimes(0);

    store.setToolCall({
      id: 'tooCall-7',
      index: 4,
      function: { name: 'notifyFunc', arguments: part1 },
    });

    // one emit change
    expect(callback).toHaveBeenCalledTimes(1);

    // Now stream the last character, causing parser to finish
    store.setToolCall({
      id: 'toolCall-7',
      index: 4,
      function: { arguments: part2 },
    });
    // two more emit change, one for the second part,
    // and one for the "onEnd" since the json is fully parsed should leave as at 3
    expect(callback).toHaveBeenCalledTimes(3);

    // Another change: delete the tool call
    // should also cause an emit change and lead us to 4
    store.deleteToolCallById('toolCall-7');
    expect(callback).toHaveBeenCalledTimes(4);

    // Unsubscribe and ensure no more calls occur
    unsubscribe();

    store.setToolCall({
      id: 'toolCall-8',
      index: 5,
      function: {
        name: 'noNotifyFunc',
        arguments: JSON.stringify({ key: 'val' }),
      },
    });
    // This should emit a change, but we unsubscribed, so callback not called again
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('getSnapShot should return the current state and clear should reset state', () => {
    const store = new ToolCallStreamStore();
    const jsonArgObj = {};
    const jsonArgStr = JSON.stringify(jsonArgObj);
    store.setToolCall({
      id: 'toolCall-9',
      index: 6,
      function: { name: 'snapFunc', arguments: jsonArgStr },
    });
    const snapshot = store.getSnapShot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].id).toBe('toolCall-9');

    store.clear();

    expect(store.getSnapShot()).toEqual([]);
  });

  it('should throw an error when tool call ID is undefined', () => {
    const expectedError =
      'Expected the initial chunk to have a tool call ID, but got undefined';
    const store = new ToolCallStreamStore();

    const invalidChunk: ToolCall = {
      index: 0,
      id: undefined,
      function: {
        name: 'test_function',
        arguments: '{}',
      },
      type: 'function',
    };

    expect(() => store.setToolCall(invalidChunk)).toThrow(expectedError);
  });

  it('should silently return if parser is not found for existing tool call', () => {
    const store = new ToolCallStreamStore();
    let parser: JSONParser | undefined;

    // Create a spy to capture the parser instance
    store.subscribe(() => {
      if (store.getSnapShot().length > 0 && !parser) {
        parser = store['parsers'].get(0);
      }
    });

    const initialChunk: ToolCall = {
      index: 0,
      id: 'call_123',
      function: {
        name: 'test_function',
        arguments: '{"firstParam": "value"}',
      },
      type: 'function',
    };
    store.setToolCall(initialChunk);

    //  Remove the parser
    store['parsers'].clear();

    // Try to update the existing tool call
    const updateChunk: ToolCall = {
      index: 0,
      id: 'call_123',
      function: {
        name: 'test_function',
        arguments: '{"secondParam": "value"}',
      },
      type: 'function',
    };

    // Should not throw an error
    expect(() => store.setToolCall(updateChunk)).not.toThrow();

    // Verify the tool call still exists but wasn't updated
    const snapshot = store.getSnapShot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].function.arguments).toEqual({ firstParam: 'value' });
  });

  it('should throw an error when function name is undefined', () => {
    const expectedError =
      'Expected the initial chunk to have a function name, but got undefined';
    const store = new ToolCallStreamStore();

    const invalidChunk: ToolCall = {
      index: 0,
      id: 'call_123',
      function: {
        name: undefined,
        arguments: '{}',
      },
      type: 'function',
    };

    expect(() => store.setToolCall(invalidChunk)).toThrow(expectedError);

    // No tool call added
    const snapshot = store.getSnapShot();
    expect(snapshot).toHaveLength(0);
  });

  it('should throw an error when trying to register a parser that already exists', () => {
    const store = new ToolCallStreamStore();

    const expectedError = 'A parser for tool call index 0 already exists.';

    // Create a parser at index zero
    store['parsers'].set(0, new JSONParser());

    const chunk: ToolCall = {
      index: 0,
      id: 'call_123',
      function: {
        name: 'test_function',
        arguments: '{}',
      },
      type: 'function',
    };

    expect(() => store.setToolCall(chunk)).toThrow(expectedError);
  });
});
