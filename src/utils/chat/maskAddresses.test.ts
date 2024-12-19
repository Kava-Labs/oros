import { maskAddresses } from './maskAddresses';
import { failureTestCases, happyPathCases } from './tokenAddressMaskingCases';
import { expect } from '@playwright/test';

describe('maskAddresses', () => {
  test('replaces single address', () => {
    happyPathCases['singleAddress'].forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

      //  the address from the test case is removed from the output
      expect(
        output.includes('0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5'),
      ).toBe(false);

      //  and stored in the map
      expect(maskedValueMap).toHaveProperty(
        '<address_1>',
        '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
      );
    });
  });

  test('replaces multiple address', () => {
    happyPathCases['multipleAddresses'].forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

      //  both addresses are removed
      expect(
        output.includes('0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5'),
      ).toBe(false);
      expect(
        output.includes('0xC07918E451Ab77023a16Fa7515Dd60433A3c771D'),
      ).toBe(false);

      expect(maskedValueMap).toHaveProperty(
        '<address_1>',
        '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
      );
      expect(maskedValueMap).toHaveProperty(
        '<address_2>',
        '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
      );
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
