import { maskAddresses } from './maskAddresses';
import { failureTestCases, happyPathCases } from './tokenAddressMaskingCases';
import { expect } from '@playwright/test';

describe('maskAddresses', () => {
  test('replaces single address', () => {
    happyPathCases['singleAddress'].forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

      //  no more 0x addresses exist
      expect(/0x[a-fA-F0-9]{40}(?!0)/g.test(output)).toBe(false);

      expect(maskedValueMap).toHaveProperty('<address_1>');
    });
  });

  test('replaces multiple address', () => {
    happyPathCases['multipleAddresses'].forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

      expect(/0x[a-fA-F0-9]{40}(?!0)/g.test(output)).toBe(false);

      expect(maskedValueMap).toHaveProperty('<address_1>');
      expect(maskedValueMap).toHaveProperty('<address_2>');
    });
  });

  test('no processing for failure cases', () => {
    failureTestCases.forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

      expect(output).toBe(testCase.input);
      expect(maskedValueMap).toStrictEqual({});
    });
  });
});
