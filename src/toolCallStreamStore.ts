import { JSONParser } from '@streamparser/json';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageToolCall,
} from 'openai/resources/index';

type Listener = () => void;

export type ToolCallStream = {
  index: number;
  id: string;
  function: Omit<
    ChatCompletionChunk.Choice.Delta.ToolCall.Function,
    'arguments'
  > & {
    arguments: Record<string, unknown>; // overrides the string ChatCompletionChunk.Choice.Delta.ToolCall.function.arguments
    partial?: boolean; // are we still streaming?
  };
  type?: 'function';
};

export class ToolCallStreamStore {
  private listeners: Set<Listener> = new Set();

  // parsers is a map of json stream parsers with
  // key as the index of the tool call
  // each tool call gets it's own stateful parser
  // parsers for the duration of the tool call stream
  private parsers: Map<number, JSONParser> = new Map();

  // "buffer" for holding streaming tool calls from a model response
  // this gets updated as the data is transformed from json to javascript object
  private toolCallStreams: ToolCallStream[] = [];

  public setToolCall(tc: ChatCompletionChunk.Choice.Delta.ToolCall) {
    for (let i = 0; i < this.toolCallStreams.length; i++) {
      if (tc.index === this.toolCallStreams[i].index) {
        // this is an update
        const streamParser = this.parsers.get(tc.index);
        if (!streamParser) {
          // we should ALWAYS have a streamParser
          // if we end up here there's a bug and it's better to just throw
          throw new Error(`ToolCallStreamStore corrupted`); // todo(sah): better error
        }

        // this throws on bad json
        // allow caller to catch the error
        streamParser.write(tc.function?.arguments ?? '');

        return; // update done
      }
    }

    // this is a new tool call
    // first chunk ALWAYS should have the tool call id and the function name
    // following chunks MAY choose to remove that and only keep the arguments part
    // but the index will be available in ALL chunks so we identify the function by it
    if (tc.id === undefined) {
      throw new Error(
        `expected first ChatCompletionChunk to contain the tool call id but got ${tc.id}`,
      );
    }

    if (tc.function?.name === undefined) {
      throw new Error(
        `expected first ChatCompletionChunk to contain function name but got ${tc.function?.name}`,
      );
    }

    // create our representation of a tool call
    const newToolCallStream: ToolCallStream = {
      index: tc.index,
      id: tc.id,
      function: {
        name: tc.function.name,
        arguments: {},
        partial: true,
      },
      type: 'function',
    };

    // don't call emitChange here
    // wait for the json parser to emit meaningful values to be consumed by UI
    this.toolCallStreams = [...this.toolCallStreams, newToolCallStream];

    this.registerToolCallJSONStreamParser(newToolCallStream.index);

    if (tc.function.arguments) {
      this.parsers.get(tc.index)!.write(tc.function.arguments ?? '');
    }
  }

  // sets up parser for a new tool call stream
  // register parser events and update state as we parse the arguments from the stream
  private registerToolCallJSONStreamParser(tcStreamIndex: number) {
    if (this.parsers.has(tcStreamIndex)) {
      throw new Error(
        `parser already exists for tool call index:${tcStreamIndex}`,
      );
    }
    const parser = new JSONParser({
      emitPartialTokens: true,
      emitPartialValues: true,
    });

    this.parsers.set(tcStreamIndex, parser);

    // on some new consumable value
    // update tool call arguments and emitChange
    parser.onValue = (info) => {
      const key = info.key;
      const val = info.value;

      if (key && val !== undefined) {
        const tcStream = this.toolCallStreams.find(
          (tc) => tc.index === tcStreamIndex,
        );
        if (!tcStream) {
          // removed from state, call end on the parser
          // and delete
          parser.end();
          parser.onValue = () => {}; // reset the callback
          this.parsers.delete(tcStreamIndex);
          return;
        }

        tcStream.function.arguments = {
          ...tcStream.function.arguments,
          [key]: val,
        };
        this.toolCallStreams = structuredClone(this.toolCallStreams);
        this.emitChange(); // emit change because arg update
      }
    };

    // on done parsing
    parser.onEnd = () => {
      const tcStream = this.toolCallStreams.find(
        (tc) => tc.index === tcStreamIndex,
      );
      if (tcStream) delete tcStream.function.partial; // no longer partial
      parser.onValue = () => {}; // reset the callback
      this.parsers.delete(tcStreamIndex);
      this.toolCallStreams = structuredClone(this.toolCallStreams);
      this.emitChange(); // emit change because a stream has ended (no longer partial)
    };
  }

  // remove the tool call stream from state along with it's parser
  public deleteToolCallById(id: string): boolean {
    const newState: ToolCallStream[] = [];
    let found = false;
    for (let i = 0; i < this.toolCallStreams.length; i++) {
      if (this.toolCallStreams[i].id !== id) {
        newState.push(this.toolCallStreams[i]);
      } else {
        // found the tool call to remove
        // shut down it's parser and delete
        found = true;
        const parser = this.parsers.get(this.toolCallStreams[i].index);
        if (parser) {
          parser.onValue = () => {};
          parser.end();
          this.parsers.delete(this.toolCallStreams[i].index);
        }
      }
    }

    this.toolCallStreams = structuredClone(newState);
    this.emitChange();
    return found;
  }

  // takes our ToolCallStream and converts it to a format
  // the API can understand (use this when adding a finished tool call stream into message history)
  public toChatCompletionMessageToolCall = (
    tcStream: ToolCallStream,
  ): ChatCompletionMessageToolCall => {
    return {
      id: tcStream.id,
      type: 'function',
      function: {
        name: tcStream.function.name ?? '',
        arguments:
          tcStream.function?.arguments !== undefined
            ? JSON.stringify(tcStream.function.arguments)
            : '',
      },
    };
  };

  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  public getSnapShot = () => {
    return this.toolCallStreams;
  };

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
