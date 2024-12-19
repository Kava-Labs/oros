import { tokenAddressMasking } from './tokenAddressMasking';
import { failureTestCases, happyPathCases } from './tokenAddressMaskingCases';
import { expect } from '@playwright/test';

describe('addressAmountAbstractionTest', () => {
  test('replaces present addresses', () => {
    happyPathCases.forEach((testCase) => {
      const { output, maskedValueMap } = tokenAddressMasking(testCase);

      //  no more 0x addresses exist
      expect(/0x[a-fA-F0-9]{40}(?!0)/g.test(output)).toBe(false);

      //  we may have more than one address, but at least one should be present
      expect(maskedValueMap).toHaveProperty('<address_1>');
    });
  });

  test('no processing for failure cases', () => {
    failureTestCases.forEach((testCase) => {
      const { output, maskedValueMap } = tokenAddressMasking(testCase);

      expect(output).toBe(testCase.input);
      expect(maskedValueMap).toStrictEqual({});
    });
  });
});
