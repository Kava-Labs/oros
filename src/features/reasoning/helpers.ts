import { ChatMessage } from '../../core/stores/messageHistoryStore';
import { ChatCompletionChunk } from 'openai/resources/index';
import { ContextMetrics } from '../../core/types/models';

/**
 * Estimates token usage based on message lengths
 * This is a fallback when actual token counts aren't available
 * @param messages - Array of message objects
 * @returns Estimated token usage
 */
export const estimateTokenUsage = (
  messages: ChatMessage[],
): {
  totalTokens: number;
} => {
  // Very rough token estimation (about 4 chars per token)
  let promptTokens = 0;
  let completionTokens = 0;
  //  tokens need to be allocated for the role
  let messageOverheadTokens = 0;

  messages.forEach((msg) => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    const contentTokens = Math.ceil(content.length / 4);

    if (msg.role === 'assistant') {
      completionTokens += contentTokens;
    } else {
      promptTokens += contentTokens;
    }

    //  rough estimate
    messageOverheadTokens += 5;
  });

  const totalTokens = promptTokens + completionTokens + messageOverheadTokens;

  return {
    totalTokens,
  };
};

export async function calculateDeepseekTokenUsage(
  messages: ChatMessage[],
  contextLength: number,
  finalChunk?: ChatCompletionChunk,
): Promise<ContextMetrics> {
  let tokensRemaining: number;

  if (finalChunk && finalChunk.usage && finalChunk.usage.total_tokens) {
    // If we have API response with token usage for this interaction
    const newTokensUsed = finalChunk.usage.total_tokens;
    tokensRemaining = Math.max(0, contextLength - newTokensUsed);
  } else {
    // If the API response fails, fall back to an estimation
    const estimatedUsage = estimateTokenUsage(messages);
    tokensRemaining = Math.max(0, contextLength - estimatedUsage.totalTokens);
  }

  const tokensUsed = contextLength - tokensRemaining;
  const percentageRemaining = Number(
    ((tokensRemaining / contextLength) * 100).toFixed(1),
  );

  return {
    tokensUsed,
    tokensRemaining,
    percentageRemaining:
      tokensUsed > 0 && percentageRemaining === 100.0
        ? 99.9
        : percentageRemaining,
  };
}
