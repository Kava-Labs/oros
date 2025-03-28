import { ChatMessage } from '../../stores/messageHistoryStore';
import { estimateTokenUsage } from './helpers';

describe('estimateTokenUsage', () => {
  it('should calculate tokens based on message length', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you for asking!' },
    ];

    const result = estimateTokenUsage(messages);

    // "Hello, how are you?" is 19 chars, so ~5 tokens
    // "I am doing well, thank you for asking!" is 42 chars, so ~10 tokens
    //  Two messages - 10 overhead tokens
    expect(result.totalTokens).toBe(25);
  });

  it('should handle empty messages', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '' },
      { role: 'assistant', content: '' },
    ];

    const result = estimateTokenUsage(messages);

    expect(result.totalTokens).toBe(10);
  });

  it('should correctly categorize tokens by role', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'User message 1' },
      { role: 'system', content: 'System message' },
      { role: 'assistant', content: 'Assistant response 1' },
      { role: 'user', content: 'User message 2' },
      { role: 'assistant', content: 'Assistant response 2' },
    ];

    const result = estimateTokenUsage(messages);

    //  User messages + system = (14 + 14 + 14)/4 ≈ 11 tokens
    //  Assistant messages = (20 + 20)/4 ≈ 10 tokens
    //  Five messages = 25 overhead tokens
    expect(result.totalTokens).toBe(47);
  });
});
