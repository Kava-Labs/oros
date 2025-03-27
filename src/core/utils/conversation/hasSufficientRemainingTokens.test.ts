import { describe, expect, it, vi } from 'vitest';
import { isWithinTokenLimit } from 'gpt-tokenizer';
import { estimateTokenUsage } from '../../config/models/helpers';
import { hasSufficientRemainingTokens } from './hasSufficientRemainingTokens';

describe('hasSufficientRemainingTokens', () => {
  vi.mock(import('gpt-tokenizer'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      isWithinTokenLimit: vi.fn(),
      encodeChat: vi.fn(),
    };
  });

  vi.mock('../../../features/reasoning/helpers', () => ({
    estimateTokenUsage: vi.fn(),
  }));

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('blockchain model', () => {
    it('calls isWithinTokenLimit with correct arguments', () => {
      hasSufficientRemainingTokens('gpt-4o', 'test input', 2000);

      expect(isWithinTokenLimit).toHaveBeenCalledWith('test input', 2000);
      expect(estimateTokenUsage).not.toHaveBeenCalled();
    });
  });

  describe('reasoning model', () => {
    it('calls estimateTokenUsage with correct arguments', () => {
      vi.mocked(estimateTokenUsage).mockReturnValue({ totalTokens: 800 });

      hasSufficientRemainingTokens('deepseek-r1', 'test input', 2000);

      expect(estimateTokenUsage).toHaveBeenCalledWith([
        { role: 'user', content: 'test input' },
      ]);
      expect(isWithinTokenLimit).not.toHaveBeenCalled();
    });
  });
});
