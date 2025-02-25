import {
  ChatMessage,
  MessageHistoryStore,
} from '../../core/stores/messageHistoryStore';
import { ChatCompletionChunk } from 'openai/resources/index';
import { ModelConfig } from '../../core/types/models';

/**
 * Estimates token usage based on message lengths
 * This is a fallback when actual token counts aren't available
 * @param messages - Array of message objects
 * @returns Estimated token usage
 */
export const estimateTokenUsage = (
  messages: ChatMessage[],
): {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
} => {
  // Very rough token estimation (about 4 chars per token)
  let promptTokens = 0;
  let completionTokens = 0;

  messages.forEach((msg) => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    const contentTokens = Math.ceil(content.length / 4);

    if (msg.role === 'assistant') {
      completionTokens += contentTokens;
    } else {
      promptTokens += contentTokens;
    }
  });

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
};

/**
 * Updates the conversation in localStorage with token usage information
 *
 * @param conversationID - The ID of the conversation
 * @param modelConfig - The model configuration with context length
 * @param usageInfo - The token usage information, either from API or estimated
 */
export const updateConversationTokens = (
  conversationID: string,
  modelConfig: { contextLength: number },
  usageInfo: { total_tokens: number },
) => {
  const { contextLength } = modelConfig;

  const allConversations = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const conversation = allConversations[conversationID];
  if (!conversation) {
    return contextLength;
  }

  // Calculate tokens remaining
  // Update the conversation
  conversation.tokensRemaining = Math.max(
    0,
    contextLength - usageInfo.total_tokens,
  );
  conversation.lastSaved = new Date().valueOf();

  allConversations[conversationID] = conversation;
  localStorage.setItem('conversations', JSON.stringify(allConversations));
};

export /**
 * Extracts token usage from a Deepseek API response chunk
 * @param chunk - The final chunk from a streaming API response
 * @returns An object with token usage information or null if not available
 */
function extractTokenUsageFromChunk(chunk: ChatCompletionChunk): {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens?: number;
} | null {
  // Check if this is the final chunk with usage information
  if (!chunk || !chunk.usage) {
    return null;
  }

  const usage = chunk.usage;

  return {
    total_tokens: usage.total_tokens,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
  };
}

// Helper function to update token usage in localStorage
export function updateTokenUsage(
  conversationID: string,
  modelConfig: ModelConfig,
  apiResponse: ChatCompletionChunk,
  messageHistoryStore: MessageHistoryStore,
) {
  // Extract token usage from the API response
  const tokenUsage = extractTokenUsageFromChunk(apiResponse);

  if (!tokenUsage) {
    // If we don't have token usage from the API, estimate it
    const messages = messageHistoryStore.getSnapshot();
    const estimatedUsage = estimateTokenUsage(messages);
    return updateConversationTokens(
      conversationID,
      modelConfig,
      estimatedUsage,
    );
  }
}
