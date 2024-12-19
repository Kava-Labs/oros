import { tokenAddressAbstraction } from './tokenAddressAbstraction';
import { happyPathCases } from './tokenAddressAbstractionCases';

describe('addressAmountAbstractionTest', () => {
  test('replaces addresses, token names, and amounts', () => {
    happyPathCases.forEach((testCase) => {
      const result = tokenAddressAbstraction(testCase);

      expect(/0x[a-fA-F0-9]{40}/i.test(result.output)).toBe(false);

      //  todo - how to determine token symbol?
      expect(/KAVA/i.test(result.output)).toBe(false);

      expect(/\d+/.test(result.output)).toBe(false);

      expect(Object.keys(result.tokenMap)).toEqual(
        expect.arrayContaining(['<address_1>', '<token_1>', '<amount_1>']),
      );
    });
  });
});
