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
    // We override the "arguments" field, which normally would be a string in the OpenAI type,
    // and instead use a Record<string, unknown> to store parsed arguments as an object.
    arguments: Record<string, unknown>;

    // "partial" indicates whether the tool call arguments are still being streamed.
    // If "partial" is true, it means we are still receiving chunks of arguments data.
    partial?: boolean;
  };
  type?: 'function';
};

export class ToolCallStreamStore {
  private listeners: Set<Listener> = new Set();

  // We maintain a map of JSON parsers, one for each tool call stream.
  // The key is the tool call's "index" (provided by the API).
  // Each parser handles the streaming JSON arguments for that specific tool call.
  private parsers: Map<number, JSONParser> = new Map();

  // toolCallStreams holds the current state of all ongoing tool calls.
  // Each entry corresponds to a tool call and the arguments we've parsed so far.
  private toolCallStreams: Readonly<ToolCallStream>[] = [];

  /**
   * Updates internal state with a new chunk of tool call data coming from the model.
   * If a tool call with this "index" already exists, we treat this as an update to its arguments.
   * If not, we create a new entry.
   *
   *
   * @param tc A piece of tool call data (one chunk) coming from the model.
   */
  public setToolCall(tc: ChatCompletionChunk.Choice.Delta.ToolCall) {
    /**
     * Note: We do not rely on direct numeric indexing (like toolCallStreams[tc.index])
     * because the "index" property from the API does not necessarily map to the position
     * in our internal array. Tool calls may be removed over time, causing their positions
     * to shift. Hence, we use array.find to locate the correct tool call by its "index" field
     * rather than assuming positional indexing.
     *
     * considerations of using an object or a map were made but we want consumers to work with arrays
     * as that is more easily handled in the UI, we can use Object.values to convert to arrays on getSnapshot
     * but that conversion will get expensive, it's worth noting also that the tool call streams array will not
     * ever contain more than a couple tool calls in progress so using the linear .find is not going to slow things down
     */
    const streamingTc = this.toolCallStreams.find((v) => v.index === tc.index);
    if (streamingTc) {
      // If we already have a tool call for this "index", we just append new argument data.
      const streamParser = this.parsers.get(tc.index);
      if (!streamParser) {
        return;
      }
      // The parser will handle streaming JSON. If the new data isn't valid JSON, it might throw.
      // caller should handle catching the error
      streamParser.write(tc.function?.arguments ?? '');
    } else {
      // If this is the first time we see this tool call, we need to set it up.
      this.addToolCall(tc);
    }
  }

  /**
   * Creates a new tool call entry with its initial metadata and arguments structure.
   * Also sets up a dedicated JSON parser for streaming arguments if needed.
   *
   * @param tc The first chunk of the new tool call.
   */
  private addToolCall(tc: ChatCompletionChunk.Choice.Delta.ToolCall) {
    // The first chunk of a tool call MUST contain the tool call's id and the function name.
    // Subsequent chunks might only have arguments, so we rely on the index to identify them.
    if (tc.id === undefined) {
      throw new Error(
        `Expected the initial chunk to have a tool call ID, but got ${tc.id}`,
      );
    }

    if (tc.function?.name === undefined) {
      throw new Error(
        `Expected the initial chunk to have a function name, but got ${tc.function?.name}`,
      );
    }

    // Create a new ToolCallStream entry with empty arguments and mark it as partial,
    // indicating that more data chunks might still be coming.
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

    // We do not emit a change event yet because we only have metadata at this point.
    // We will emit changes as arguments arrive and are parsed.
    this.toolCallStreams = [...this.toolCallStreams, newToolCallStream];

    // Set up a streaming JSON parser for this tool call's arguments.
    this.registerToolCallJSONStreamParser(newToolCallStream.index);

    // If the initial chunk already comes with some arguments, start parsing them immediately.
    if (tc.function.arguments) {
      this.parsers.get(tc.index)!.write(tc.function.arguments ?? '');
    }
  }

  /**
   * Creates and configures a new JSON parser for the given tool call.
   * This parser will transform incoming argument data (which may arrive in fragments)
   * into JavaScript objects. As we parse new values, we update the tool call's arguments.
   *
   * @param tcStreamIndex The index of the tool call for which we're setting up the parser.
   */
  private registerToolCallJSONStreamParser(tcStreamIndex: number) {
    if (this.parsers.has(tcStreamIndex)) {
      throw new Error(
        `A parser for tool call index ${tcStreamIndex} already exists.`,
      );
    }

    const parser = new JSONParser({
      emitPartialTokens: true,
      emitPartialValues: true,
    });

    this.parsers.set(tcStreamIndex, parser);

    // The parser emits 'onValue' whenever it successfully parses a key-value pair from the JSON.
    parser.onValue = (info) => {
      const key = info.key;
      const val = info.value;

      if (val !== undefined) {
        // Again, we use .find here rather than direct indexing,
        // because the position of a tool call in our array may not match its API "index".
        const tcStream = this.toolCallStreams.find(
          (tc) => tc.index === tcStreamIndex,
        );
        if (!tcStream) {
          // If the tool call was removed before we finished parsing,
          // we stop parsing and clean up.
          this.shutdownParser(parser);
          this.parsers.delete(tcStreamIndex);
          return;
        }

        if (key !== undefined) {
          if (info.stack.length <= 1) {
            tcStream.function.arguments = {
              ...tcStream.function.arguments,
              [key]: val,
            };
          }
        } else {
          // @ts-expect-error some other structure with no key
          tcStream.function.arguments = val;
        }

        // Because we've mutated the tool call's arguments, create a fresh copy of the state
        this.toolCallStreams = structuredClone(this.toolCallStreams);

        // Notify subscribers that something changed.
        this.emitChange();
      }
    };

    // The parser's 'onEnd' event is triggered when the parser reaches the end of the JSON input.
    // This means no more argument data is coming. We can mark the tool call as complete.
    parser.onEnd = () => {
      const tcStream = this.toolCallStreams.find(
        (tc) => tc.index === tcStreamIndex,
      );

      // If the tool call still exists in our state, mark it as no longer partial.
      if (tcStream) {
        delete tcStream.function.partial;
      }

      // Reset parser callbacks and remove the parser from our tracking map
      // because we're done parsing for this tool call.
      parser.onEnd = () => {};
      parser.onValue = () => {};
      this.parsers.delete(tcStreamIndex);

      // Update our state to reflect that this tool call is complete,
      // then notify subscribers.
      this.toolCallStreams = structuredClone(this.toolCallStreams);
      this.emitChange();
    };
  }

  /**
   * Deletes a tool call by its ID, if it exists.
   * This involves removing the tool call from our state and cleaning up its parser.
   *
   * @param id The ID of the tool call to remove.
   * @returns true if a tool call was found and removed, false otherwise.
   */
  public deleteToolCallById(id: string): boolean {
    const newState: ToolCallStream[] = [];
    let found = false;

    for (let i = 0; i < this.toolCallStreams.length; i++) {
      if (this.toolCallStreams[i].id !== id) {
        // If this tool call doesn't match the ID, keep it.
        newState.push(this.toolCallStreams[i]);
      } else {
        // If we found the tool call to remove:
        found = true;
        const parser = this.parsers.get(this.toolCallStreams[i].index);
        if (parser) {
          // Stop the parser since this tool call is no longer relevant.
          this.shutdownParser(parser);
          this.parsers.delete(this.toolCallStreams[i].index);
        }
      }
    }

    // Update our state without the removed tool call.
    this.toolCallStreams = structuredClone(newState);
    this.emitChange();
    return found;
  }

  /**
   * Clears all ongoing tool call streams and their corresponding parsers.
   *
   * - Terminates all JSON parsers for currently active tool calls.
   * - Cleans up event handlers associated with these parsers.
   * - Empties the internal store of tool call streams.
   * - Notifies subscribers that the state has changed.
   *
   */
  public clear() {
    for (const [, parser] of this.parsers) {
      this.shutdownParser(parser);
    }

    this.parsers.clear();
    this.toolCallStreams = [];
    this.emitChange();
  }

  private shutdownParser(parser: JSONParser) {
    // calling end while parsing is in progress throws an error
    // we don't care since we are clearing the state so just log the error
    // and move one
    try {
      parser.onEnd = () => {}; // reset callback
      parser.onValue = () => {}; // reset callback
      parser.end(); // call end
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Converts a ToolCallStream instance (our internal representation) into
   * the ChatCompletionMessageToolCall format expected by the API.
   *
   * Use this method when you want to take a completed tool call and insert it
   * into the chat message history, for example.
   *
   * @param tcStream The internal representation of the tool call.
   * @returns A ChatCompletionMessageToolCall object suitable for the API.
   */
  public toChatCompletionMessageToolCall = (
    tcStream: ToolCallStream,
  ): ChatCompletionMessageToolCall => {
    return {
      id: tcStream.id,
      type: 'function',
      function: {
        name: tcStream.function.name ?? '',
        // Convert arguments back into a JSON string because the API expects arguments as a string.
        arguments:
          tcStream.function?.arguments !== undefined
            ? JSON.stringify(tcStream.function.arguments)
            : '',
      },
    };
  };

  /**
   * Subscribe to changes in the tool call stream store.
   * The callback you provide will be called whenever the internal state changes.
   *
   * @param callback A function to call when the store changes.
   * @returns A cleanup function that, when called, removes this listener.
   */
  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  /**
   * Returns the current snapshot of all tool calls and their parsed arguments.
   * This is a read-only view of the state as it currently stands.
   */
  public getSnapShot = () => {
    return this.toolCallStreams;
  };

  /**
   * Calls all registered listeners to notify them of state changes.
   */
  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
