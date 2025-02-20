import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MAX_TOKENS, useChatContextMonitor } from './useChatContextMonitor';
import { ChatMessage } from '../stores/messageHistoryStore';

describe('useChatContextMonitor', () => {
  it('initializing with system prompt', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'I am helpful' },
    ];
    const { result } = renderHook(() => useChatContextMonitor(mockMessages));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toEqual({
      tokensUsed: 8, //  amount from the system prompt
      tokensRemaining: MAX_TOKENS - 8,
      percentageRemaining: 99.9,
    });
  });

  it('decrements as a conversation proceeds', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'I am helpful' },
      {
        role: 'user',
        content: 'Lorem ipsum odor amet, consectetuer adipiscing elit.',
      },
    ];
    const { result } = renderHook(() => useChatContextMonitor(mockMessages));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toEqual({
      tokensUsed: 24, //  additional tokens used
      tokensRemaining: MAX_TOKENS - 24,
      percentageRemaining: 99.9,
    });

    const updatedMessages: ChatMessage[] = [
      ...mockMessages,
      { role: 'assistant', content: 'Do you speak Latin?' },
    ];

    const { result: updatedResult } = renderHook(() =>
      useChatContextMonitor(updatedMessages),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updatedResult.current).toEqual({
      tokensUsed: 34, //  more tokens used
      tokensRemaining: MAX_TOKENS - 34,
      percentageRemaining: 99.9,
    });
  });

  it('handles large input', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'Make a giant string'.repeat(30000) },
    ];
    const { result } = renderHook(() => useChatContextMonitor(mockMessages));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toEqual({
      tokensUsed: 120005,
      tokensRemaining: MAX_TOKENS - 120005,
      percentageRemaining: 6.2,
    });
  });

  it('handles edge case of no system prompt', async () => {
    const mockMessages: ChatMessage[] = [];
    const { result } = renderHook(() => useChatContextMonitor(mockMessages));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current).toEqual({
      tokensUsed: 0,
      tokensRemaining: MAX_TOKENS,
      percentageRemaining: 100.0,
    });
  });
});
