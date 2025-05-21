import type { ChatCompletionChunk } from 'openai/resources/index';

/**
 * Type hacking! The same type as OpenAI's ChatCompletionChunk but adding an optional
 * "reasoning_content" string field to the Deltas.
 *
 * Some models are served with a reasoning parser that extracts any thinking content to
 * this separate feild
 */
type ChatCompletionReasoningChunk = Omit<ChatCompletionChunk, 'choices'> & {
  choices: Omit<ChatCompletionChunk.Choice, 'delta'> &
    { delta: ChatDeltaWithReasoning }[];
};

type ChatDeltaWithReasoning = ChatCompletionChunk.Choice.Delta & {
  reasoning_content?: string;
};

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

export const isReasoningChunk = (
  result: ChatCompletionChunk | ChatCompletionReasoningChunk,
): result is ChatCompletionReasoningChunk => {
  if (result.usage) {
    return false;
  }
  if (!result.choices || result.choices.length === 0) {
    return false;
  }
  const delta = result.choices[0].delta as ChatDeltaWithReasoning;
  return delta && typeof delta.reasoning_content === 'string';
};
