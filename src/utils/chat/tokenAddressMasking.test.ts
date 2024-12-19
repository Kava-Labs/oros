import { tokenAddressMasking } from './tokenAddressMasking';
import { failureTestCases, happyPathCases } from './tokenAddressMaskingCases';
import { expect } from '@playwright/test';

describe('addressAmountAbstractionTest', () => {
  test('replaces present addresses', () => {
    happyPathCases.forEach((testCase) => {
      const result = tokenAddressMasking(testCase);

      //  output is only null in failure cases
      if (result.output) {
        //  no more 0x addresses exist
        expect(/0x[a-fA-F0-9]{40}(?!0)/g.test(result.output)).toBe(false);

        //  we may have more than one address, but at least one should be present
        expect(Object.keys(result.tokenMap)).toEqual(
          expect.arrayContaining(['<address_1>']),
        );
      }
    });
  });

  test('no processing for failure cases', () => {
    failureTestCases.forEach((testCase) => {
      const result = tokenAddressMasking(testCase);

      expect(result.output).toBe(testCase.input);
      expect(result.tokenMap).toStrictEqual({});
    });
  });
});
