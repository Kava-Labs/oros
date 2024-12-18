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

export const useToolCallStream = (toolCallStore: ToolCallStore) => {
  const toolCalls = useSyncExternalStore(
    toolCallStore.subscribe,
    toolCallStore.getSnapshot,
  );

  const [state, setState] = useState({
    prompt: '',
    symbol: '',
    name: '',
    about: '',
  });

  const parsers = useRef<null | Map<string, ToolCallParser>>(null);

  const extractArgsFromStream = useCallback((tc: ToolCall) => {
    if (!parsers.current) return;
    if (!tc.id) return;
    // check if this is a new tool call, if so set up a new stateful JSON parser
    // this parser will live for as:
    // 1. we are done parsing
    // 2. json parse error is encounter
    // 3. the tool call is removed from state
    if (!parsers.current.has(tc.id)) {
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
        if (
          isString(key) &&
          isString(val) &&
          state.hasOwnProperty(key as string)
        ) {
          setState((prev) => ({ ...prev, [key as string]: val }));
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
    }

    const tcParser = parsers.current.get(tc.id);
    if (tc.function && tcParser && isString(tc.function.arguments)) {
      tcParser.streamParser.write(
        (tc.function.arguments as string).slice(tcParser.indexReached),
      );
      tcParser.indexReached = (tc.function.arguments as string).length;
    }
  }, []);

  useEffect(() => {
    if (!parsers.current) {
      parsers.current = new Map();
    }
    if (!toolCalls.length) {
      setState({ prompt: '', symbol: '', name: '', about: '' });
      if (parsers.current) parsers.current.clear(); // remove all parsers
    }

    for (const tc of toolCalls) {
      if (tc.function?.name === 'generateCoinMetadata')
        extractArgsFromStream(tc);
    }
  }, [toolCalls]);

  console.log(state);
  return state;
};

const isString = (something: unknown): boolean => {
  return typeof something === 'string' || something instanceof String;
};
