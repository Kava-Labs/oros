import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ToolCall, ToolCallStore } from './toolCallStore';
import { JSONParser } from '@streamparser/json';

type ToolCallParser = {
  streamParser: JSONParser;
  indexReached: number;
  toolCallId: string;
};

type StreamingToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export const useToolCallStream = (toolCallStore: ToolCallStore) => {
  const toolCalls = useSyncExternalStore(
    toolCallStore.subscribe,
    toolCallStore.getSnapshot,
  );

  const [state, setState] = useState<StreamingToolCall[]>([]);

  const parsers = useRef<null | Map<string, ToolCallParser>>(null);

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
      if (tc.function && tcParser && isString(tc.function.arguments)) {
        tcParser.streamParser.write(
          (tc.function.arguments as string).slice(tcParser.indexReached),
        );
        tcParser.indexReached = (tc.function.arguments as string).length;
      }
    },
    [state],
  );

  const registerToolCallParser = (tc: ToolCall) => {
    if (!parsers.current) return;
    if (!tc.id) return;

    const tcParser = {
      streamParser: new JSONParser({
        emitPartialTokens: true,
        emitPartialValues: true,
      }),
      indexReached: 0,
      toolCallId: tc.id,
    };
    parsers.current.set(tc.id, tcParser);

    tcParser.streamParser.onValue = (info) => {
      const key = info.key;
      const val = info.value;

      if (isString(key) && val !== undefined) {
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
                arguments: {
                  ...v.arguments,
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
              arguments: {
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
      console.info('done');
      tcParser.streamParser.onValue = () => {};
      parsers.current?.delete(tcParser.toolCallId);
    };

    // when an error is encounter remove the tool call parser
    tcParser.streamParser.onError = (err) => {
      console.error('steaming JSON Parser Error', err); // todo(sah): handle invalid json error
      tcParser.streamParser.onValue = () => {};
      parsers.current?.delete(tcParser.toolCallId);
    };
  };

  useEffect(() => {
    if (!parsers.current) {
      parsers.current = new Map();
    }
    if (!toolCalls.length) {
      setState([]);
      if (parsers.current) parsers.current.clear(); // remove all parsers
    }

    for (const tc of toolCalls) {
      extractArgsFromStream(tc);
    }
  }, [toolCalls]);

  if (state.length) {
    console.log(state[0].arguments);
  } else {
    console.log(state);
  }

  return state;
};

const isString = (something: unknown): boolean => {
  return typeof something === 'string' || something instanceof String;
};
