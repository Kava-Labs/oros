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
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
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

  const totalTokens = promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
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
  usageInfo: { totalTokens: number },
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
    contextLength - usageInfo.totalTokens,
  );
  conversation.lastSaved = new Date().valueOf();

  allConversations[conversationID] = conversation;
  localStorage.setItem('conversations', JSON.stringify(allConversations));
};

/**
 * Extracts token usage from a Deepseek API response chunk
 * @param chunk - The final chunk from a streaming API response
 * @returns An object with token usage information or null if not available
 */
export const extractTokenUsageFromChunk = (chunk: ChatCompletionChunk) => {
  // Check if this is the final chunk with usage information
  if (!chunk || !chunk.usage) {
    return null;
  }

  const usage = chunk.usage;

  return {
    totalTokens: usage.total_tokens,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
  };
};

/**
 * Updates token usage information for a conversation
 * First attempts to extract token usage from API response, then falls back to estimation
 *
 * @param conversationID - The unique identifier for the conversation
 * @param modelConfig - Configuration for the model, containing context length
 * @param apiResponse - Response from the API, potentially containing token usage data
 * @param messageHistoryStore - Store containing message history for token estimation
 * @returns Context length remaining after update (returned from updateConversationTokens)
 */
export const updateTokenUsage = (
  conversationID: string,
  modelConfig: ModelConfig,
  apiResponse: ChatCompletionChunk,
  messageHistoryStore: MessageHistoryStore,
) => {
  // Extract token usage from the API response
  const tokenUsage =
    modelConfig.id === 'deepseek-r1'
      ? extractTokenUsageFromChunk(apiResponse)
      : 0;

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
  return updateConversationTokens(conversationID, modelConfig, tokenUsage);
};
