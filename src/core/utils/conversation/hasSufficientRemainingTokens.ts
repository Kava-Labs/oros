import { SupportedModels } from '../../types/models';
import { isWithinTokenLimit } from 'gpt-tokenizer';
import { estimateTokenUsage } from '../../../features/reasoning/helpers';

/**
 * Checks if the input string is within the token limit for a given model.
 *
 * This function determines whether the input can be processed by checking
 * its token usage against the model's context length. The token estimation
 * method varies depending on the model.
 *
 * @param {SupportedModels} modelID - The identifier model being used.
 * @param {string} input - The input text to be checked against available tokens
 * @param {number} availableTokens - The remaining number of available tokens in the conversation.
 *
 * @returns {boolean} - Returns true if the input is within the token limit, false otherwise.
 */
export const hasSufficientRemainingTokens = (
  modelID: SupportedModels,
  input: string,
  availableTokens: number,
): boolean => {
  if (modelID === 'gpt-4o') {
    //  this helper returns the amount available if it's within the limit or false if it's not,
    return Boolean(isWithinTokenLimit(input, availableTokens));
  } else {
    const { totalTokens: tokensToBeUsed } = estimateTokenUsage([
      { role: 'user', content: input },
    ]);
    return tokensToBeUsed < availableTokens;
  }
};
