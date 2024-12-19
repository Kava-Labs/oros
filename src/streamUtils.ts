import type { ChatCompletionChunk } from 'openai/resources/index';
import { ToolCall, ToolCallStreamStore } from './toolCallStreamStore';

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

export const assembleToolCallsFromStream = (
  result: ChatCompletionChunk,
  toolCallStreamStore: ToolCallStreamStore,
): void => {
  const toolCalls: ToolCall[] = toolCallStreamStore.getSnapshot();

  if (!result.choices[0].delta?.tool_calls) {
    return;
  }

  for (const tcChunk of result.choices[0].delta.tool_calls) {
    if (toolCalls.length <= tcChunk.index) {
      // Push a new tool call request.
      toolCalls.push({
        index: tcChunk.index,
        id: '',
        function: { name: '', arguments: '' },
      });
    }
    // Fill in info as we get it streamed for the corresponding tool call index.
    // don't use toolCalls[tcChunk.index] because indices are invalidated on stuff gets deleted
    // so it's best to do a find by index field
    const partialTC = toolCalls.find((tc) => tc.index === tcChunk.index);
    if (partialTC) {
      if (tcChunk.id) partialTC.id += tcChunk.id;
      if (tcChunk.function?.name)
        partialTC.function!.name += tcChunk.function.name;
      if (tcChunk.function?.arguments)
        partialTC.function!.arguments += tcChunk.function.arguments;
    }
  }

  toolCallStreamStore.setToolCalls(structuredClone(toolCalls));
};
