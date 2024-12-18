import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ToolCall, ToolCallStore } from './toolCallStore';

enum ParseState {
  FINDING_KEY,
  SKIPPING_SPECIAL_CHARS_AFTER_KEY,
  FINDING_COLON,
  SKIPPING_SPECIAL_CHARS_BEFORE_VALUE,
  EXTRACTING_VALUE,
}

type Parser = {
  idx: number;
  key: null | string;
  remainingKeys: Set<string>;
  state: ParseState;
};

export const useToolCallStream = (toolCallStore: ToolCallStore) => {
  const toolCalls = useSyncExternalStore(
    toolCallStore.subscribe,
    toolCallStore.getSnapshot,
  );

  const parser = useRef<Parser | null>(null);

  const [state, setState] = useState({
    prompt: '',
    symbol: '',
    name: '',
    about: '',
  });

  const extractArgsFromStream = useCallback((tc: ToolCall): void => {
    if (!tc.function) return;
    if (!tc.function.arguments) return;
    if (!parser.current) return;

    if (!parser.current.remainingKeys.size) {
      console.info(`[INFO] found all keys`);
      return;
    }

    // parser state machine
    switch (parser.current.state) {
      case ParseState.FINDING_KEY: {
        for (const key of parser.current.remainingKeys) {
          const i = tc.function.arguments.indexOf(key);
          if (notReachedEnd(i, tc.function.arguments)) {
            parser.current.state = ParseState.SKIPPING_SPECIAL_CHARS_AFTER_KEY;
            parser.current.idx = i + key.length; // add key.length to skip the key itself
            parser.current.key = key;

            extractArgsFromStream(tc); // call
          }
        }
        break;
      }
      case ParseState.SKIPPING_SPECIAL_CHARS_AFTER_KEY: {
        const i = skipSpecialCharacters(
          tc.function.arguments,
          parser.current.idx,
        );
        if (notReachedEnd(i, tc.function.arguments)) {
          parser.current.state = ParseState.FINDING_COLON;
          parser.current.idx = i;
          extractArgsFromStream(tc); // call
        }
        break;
      }
      case ParseState.FINDING_COLON: {
        const i = findColon(tc.function.arguments, parser.current.idx);
        if (
          notReachedEnd(i, tc.function.arguments) &&
          notReachedEnd(i + 1, tc.function.arguments)
        ) {
          parser.current.state = ParseState.SKIPPING_SPECIAL_CHARS_BEFORE_VALUE;
          parser.current.idx = i + 1;
          extractArgsFromStream(tc); // call
        }
        break;
      }

      case ParseState.SKIPPING_SPECIAL_CHARS_BEFORE_VALUE: {
        const i = skipSpecialCharacters(
          tc.function.arguments,
          parser.current.idx,
        );
        if (notReachedEnd(i, tc.function.arguments)) {
          parser.current.state = ParseState.EXTRACTING_VALUE;
          parser.current.idx = i;
          extractArgsFromStream(tc); // call
        }
        break;
      }
      case ParseState.EXTRACTING_VALUE:
        {
          if (notReachedEnd(parser.current.idx + 1, tc.function.arguments)) {
            const [valueEndIndex, done] = extractStringValue(
              tc.function.arguments,
              parser.current.idx,
            );

            const key = parser.current.key!.replace(/"/g, '');
            const val = unescapeString(
              tc.function.arguments.slice(
                parser.current.idx + 1,
                valueEndIndex,
              ),
            );
            // console.log(`${key}: ${val}`);

            setState((prev) => ({
              ...prev,
              [key]: val,
            }));

            if (done) {
              parser.current.remainingKeys.delete(parser.current.key!);
              parser.current.key = null;
              // todo: we should likely not start from zero when finding looking for more keys
              parser.current.idx = 0;
              parser.current.state = ParseState.FINDING_KEY;
            }
          }
        }
        break;
    }
  }, []);

  useEffect(() => {
    // https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents
    if (parser.current === null || !toolCalls.length) {
      parser.current = {
        idx: 0,
        key: null,
        remainingKeys: new Set(['"prompt"', '"symbol"', '"name"', '"about"']),
        state: ParseState.FINDING_KEY,
      };
    }

    if (!toolCalls.length) {
      setState({ prompt: '', symbol: '', name: '', about: '' });
    }

    for (const tc of toolCalls) {
      if (tc.function?.name === 'generateCoinMetadata')
        extractArgsFromStream(tc);
    }
  }, [toolCalls]);

  console.log(state);

  return state;
};

const skipSpecialCharacters = (str: string, idx = 0): number => {
  while (idx < str.length) {
    switch (str[idx]) {
      case '\n':
        idx++;
        break;
      case '\t':
        idx++;
        break;
      case ' ':
        idx++;
        break;
      case '\r':
        idx++;
        break;
      case '\\':
        idx++;
        break;
      default:
        return idx;
    }
  }

  return -1;
};

const findColon = (str: string, idx = 0): number => {
  while (idx < str.length) {
    if (str[idx] === ':') return idx;
    idx++;
  }
  return -1;
};

const notReachedEnd = (keyIdx: number, str: string) => {
  return keyIdx > 0 && keyIdx < str.length;
};

const extractStringValue = (str: string, idx = 0): [number, boolean] => {
  if (str[idx] !== '"') {
    throw new Error(
      `JSON Stream Error: expected to be at string value start but got ${str[idx]} at index ${idx} data: ${str}`,
    );
  }

  idx++;
  let reachedEnd = false;

  while (idx < str.length) {
    if (str[idx] === '"') {
      // Check if this double quote is NOT escaped
      if (
        str[idx - 1] !== '\\' ||
        (str[idx - 1] === '\\' && str[idx - 2] === '\\')
      ) {
        reachedEnd = true;
        break;
      }
    }
    idx++;
  }

  return [idx, reachedEnd];
};

const unescapeString = (str: string): string => {
  let result = '';
  let i = 0;

  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length) {
      // Handle escaped characters
      const nextChar = str[i + 1];
      if (nextChar === '"' || nextChar === '\\') {
        result += nextChar; // Add the unescaped character
        i += 2; // Skip the escape character and the next character
      } else {
        // Add the backslash as-is (uncommon but valid for unknown escapes)
        result += str[i];
        i++;
      }
    } else {
      result += str[i]; // Add non-escaped characters directly
      i++;
    }
  }

  return result;
};
