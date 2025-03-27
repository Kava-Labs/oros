import type { ChatCompletionChunk } from 'openai/resources/index';

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
  //  Sometimes content is an empty string, so we check if content is a string property.
  return delta && 'content' in delta && typeof delta.content === 'string';
};
