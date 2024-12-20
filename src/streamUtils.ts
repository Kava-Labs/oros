import type { ChatCompletionChunk } from 'openai/resources/index';
import { ToolCallStreamStore } from './toolCallStreamStore';

/**
 * Checks if the given ChatCompletionChunk is a content chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains content, false otherwise.
 */
export const isContentChunk = (result: ChatCompletionChunk): boolean => {
  const delta = result.choices[0].delta;
  // Sometimes content is an empty string, so we check if content is a string property.
  if (delta && 'content' in delta && typeof delta.content === 'string') {
    return true;
  }
  return false;
};

/**
 * Checks if the given ChatCompletionChunk is a tool call chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains tool calls, false otherwise.
 */
export const isToolCallChunk = (result: ChatCompletionChunk): boolean => {
  if (result.choices[0]?.delta && result.choices[0].delta.tool_calls) {
    return true;
  }
  return false;
};

/**
 * Assembles tool calls from the streamed ChatCompletionChunk.
 * @param result - The ChatCompletionChunk containing tool call data.
 * @param toolCallsStreamStore - The tool call stream store to send the chunks for processing
 */
export const assembleToolCallsFromStream = (
  result: ChatCompletionChunk,
  toolCallsStreamStore: ToolCallStreamStore,
): void => {
  if (!result.choices[0].delta?.tool_calls) {
    return;
  }

  // Assemble chunks of the tool call.
  // Iterate over all tool calls (more than one may be present).
  for (const tcChunk of result.choices[0].delta.tool_calls) {
    toolCallsStreamStore.setToolCall(tcChunk);
    // if (toolCallsState.length <= tcChunk.index) {
    //   // Push a new tool call request.
    //   toolCallsState.push({
    //     index: tcChunk.index,
    //     id: '',
    //     function: { name: '', arguments: '' },
    //   });
    // }
    // // Fill in info as we get it streamed for the corresponding tool call index.
    // const partialTC = toolCallsState[tcChunk.index];
    // if (tcChunk.id) partialTC.id += tcChunk.id;
    // if (tcChunk.function?.name)
    //   partialTC.function!.name += tcChunk.function.name;
    // if (tcChunk.function?.arguments)
    //   partialTC.function!.arguments += tcChunk.function.arguments;
  }
};
