import { useState, useEffect } from 'react';
import { ChatMessage } from '../stores/messageHistoryStore';
import { estimateTokenCount } from '../utils/conversation/helpers';

//  todo - put on model configuration
export const MAX_TOKENS = 128000;

interface ContextMetrics {
  tokensUsed: number;
  tokensRemaining: number;
  percentageRemaining: number;
}

//  todo - this should be a model-specific tool, likely one of the optional processors
/**
 * Hook to monitor context window token usage in a conversation
 * Returns metrics about token usage and remaining capacity
 */
export const useChatContextMonitor = (
  messages: ChatMessage[],
): ContextMetrics => {
  const [contextMetrics, setContextMetrics] = useState<ContextMetrics>({
    tokensUsed: 0,
    tokensRemaining: MAX_TOKENS,
    percentageRemaining: 100,
  });

  useEffect(() => {
    const tokensUsed = estimateTokenCount(messages);
    const tokensRemaining = Math.max(0, MAX_TOKENS - tokensUsed);
    let percentageRemaining = Number(
      ((tokensRemaining / MAX_TOKENS) * 100).toFixed(1),
    );

    //  if tokens have been used, don't ever round up to 100%
    //  since that's not intuitive and seems wrong
    if (tokensUsed > 0 && percentageRemaining === 100.0) {
      percentageRemaining = 99.9;
    }

    setContextMetrics({
      tokensUsed,
      tokensRemaining,
      percentageRemaining,
    });
  }, [messages]);

  return contextMetrics;
};
