import type { ChatCompletionChunk } from 'openai/resources/index';
import { ToolCallStreamStore } from '../stores/toolCallStreamStore';

/**
 * Checks if the given ChatCompletionChunk is a content chunk.
 * @param result - The ChatCompletionChunk to check.
 * @returns True if the chunk contains content, false otherwise.
 */
export const isContentChunk = (result: ChatCompletionChunk): boolean => {
  //  Treat usage-only chunks as content chunks
  if (result.usage && (!result.choices || result.choices.length === 0)) {
    return true;
  }
  const delta = result.choices[0].delta;
  // Sometimes content is an empty string, so we check if content is a string property.
  return delta && 'content' in delta && typeof delta.content === 'string';
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

  for (const tcChunk of result.choices[0].delta.tool_calls) {
    toolCallsStreamStore.setToolCall(tcChunk);
  }
};
