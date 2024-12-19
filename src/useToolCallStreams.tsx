import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ToolCall, ToolCallStreamStore } from './toolCallStreamStore';
import { JSONParser } from '@streamparser/json';

type ToolCallParser = {
  streamParser: JSONParser;
  indexReached: number;
  toolCallId: string;
  toolCallFunctionName: string;
};

type StreamingToolCall = {
  id: string;
  name: string;
  argumentsStream: Record<string, unknown>;
};

export const useToolCallStreams = (
  toolCallStreamStore: ToolCallStreamStore,
) => {
  const toolCalls = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapshot,
  );

  const [state, setState] = useState<StreamingToolCall[]>([]);

  const parsers = useRef<null | Map<string, ToolCallParser>>(null);

  const finishedToolCalls = useRef<null | Set<string>>(null);

  const extractArgsFromStream = useCallback(
    (tc: ToolCall) => {
      if (!parsers.current) return;
      if (!tc.id) return;
      if (!tc.function) return;
      if (!tc.function.name) return;
      // check if this is a new tool call, if so set up a new stateful JSON parser
      // this parser will live until:
      // 1. we are done parsing
      // 2. json parse error is encounter
      // 3. the tool call is removed from state
      if (!parsers.current.has(tc.id)) {
        registerToolCallParser(tc);
      }

      const tcParser = parsers.current.get(tc.id);
      if (
        tcParser &&
        isString(tc.function.arguments) &&
        tcParser.indexReached < tc.function.arguments!.length
      ) {
        tcParser.streamParser.write(
          (tc.function.arguments as string).slice(tcParser.indexReached),
        );
        tcParser.indexReached = (tc.function.arguments as string).length;
      }
    },
    [state],
  );

  const registerToolCallParser = (tc: ToolCall) => {
    if (!parsers.current || !finishedToolCalls.current) return;
    if (!tc.id) return;
    if (!tc.function) return;
    if (!tc.function.name) return;
    if (finishedToolCalls.current.has(tc.id)) return;

    console.debug(`setting up JSON parser for tool call id: ${tc.id}`);

    const tcParser = {
      streamParser: new JSONParser({
        emitPartialTokens: true,
        emitPartialValues: true,
      }),
      indexReached: 0,
      toolCallId: tc.id,
      toolCallFunctionName: tc.function.name,
    };
    parsers.current.set(tc.id, tcParser);

    tcParser.streamParser.onValue = (info) => {
      const key = info.key;
      const val = info.value;

      if (isString(key) && val !== undefined) {
        // the prompt part of the json stream is complete and can be used to generate an image
        // if (tcParser.toolCallFunctionName === 'generateCoinMetadata' &&  key === 'prompt' && !info.partial) {
        //   console.log('generateCoinMetadata prompt part is done!');
        // }

        // set the arbitrary key value pair into state for the specific
        // tool call id
        setState((prev) => {
          const newState: StreamingToolCall[] = [];
          let found = false;
          for (const v of prev) {
            if (v.id === tc.id) {
              found = true;
              newState.push({
                ...v,
                argumentsStream: {
                  ...v.argumentsStream,
                  [key as string]: val,
                },
              });
            } else {
              newState.push({
                ...v,
              });
            }
          }

          if (!found) {
            newState.push({
              id: tc.id as string,
              name: tc.function?.name as string,
              argumentsStream: {
                [key as string]: val,
              },
            });
          }

          return newState;
        });
      }
    };

    // when done parsing remove the tool call parser
    tcParser.streamParser.onEnd = () => {
      console.debug(
        `finished parsing json stream for tool call id: ${tcParser.toolCallId}`,
      );
      finishedToolCalls.current!.add(tcParser.toolCallId);
      tcParser.streamParser.onValue = () => {};
      parsers.current?.delete(tcParser.toolCallId);
    };

    // when an error is encounter remove the tool call parser
    tcParser.streamParser.onError = (err) => {
      console.error('steaming JSON Parser Error', err); // todo(sah): handle invalid json error
      finishedToolCalls.current!.add(tcParser.toolCallId);
      tcParser.streamParser.onValue = () => {};
      parsers.current?.delete(tcParser.toolCallId);
    };
  };

  // sets up tool call streaming
  useEffect(() => {
    if (!parsers.current) {
      parsers.current = new Map();
    }

    if (!finishedToolCalls.current) {
      finishedToolCalls.current = new Set<string>();
    }

    for (const tc of toolCalls) {
      extractArgsFromStream(tc);
    }
  }, [toolCalls]);

  // sync the streaming state with the tool call store
  // removing the streaming state when the tool call is no longer
  // in the toolCallStreamStore
  useEffect(() => {
    const staleToolCallIds: Set<string> = new Set();
    for (const streamingTc of state) {
      if (!toolCalls.find((tc) => tc.id === streamingTc.id)) {
        staleToolCallIds.add(streamingTc.id);
      }
    }

    if (staleToolCallIds.size) {
      setState((prev) => {
        const newState: StreamingToolCall[] = [];

        for (const tc of prev) {
          if (!staleToolCallIds.has(tc.id)) {
            newState.push(structuredClone(tc));
          }
        }
        return newState;
      });

      if (parsers.current) {
        for (const id of staleToolCallIds) {
          console.debug(`removing completed tool call id: ${id}`);
          if (finishedToolCalls.current) finishedToolCalls.current.add(id);
          parsers.current.delete(id);
        }
      }
    }
  }, [state, toolCalls]);

  return state;
};

const isString = (something: unknown): boolean => {
  return typeof something === 'string' || something instanceof String;
};
