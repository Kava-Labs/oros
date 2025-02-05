import { unmaskAddresses } from './unmaskAddresses';

interface UnmaskAddressesTestCase {
  input: string;
  expectedOutput: string;
  masksToValues: Record<string, string>;
}

describe('unmaskAddresses', () => {
  test('replaces address mask(s)', () => {
    const testCases: Array<UnmaskAddressesTestCase> = [
      {
        input: 'Send 100 KAVA to address_1',
        expectedOutput:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA to address_1!',
        expectedOutput:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5!',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA toaddress_1',
        expectedOutput:
          'Send 100 KAVA to0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA and 0.01 wBTC to address_1',
        expectedOutput:
          'Send 100 KAVA and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA to address_1 and 0.01 wBTC to address_1',
        expectedOutput:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA to address_1 and 0.01 wBTC to address_2',
        expectedOutput:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xc07918e451ab77023a16fa7515dd60433a3c771d',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          address_2: '0xc07918e451ab77023a16fa7515dd60433a3c771d',
        },
      },
      {
        input:
          'Send 10 KAVA to the following addresses: address_1, address_2, address_3, address_4',
        expectedOutput:
          'Send 10 KAVA to the following addresses: 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5, 0xc07918e451ab77023a16fa7515dd60433a3c771d, 0x7bbf300890857b8c241b219c6a489431669b3afa, 0x1874c3e9d6e5f7e4f3f22c3e260c8b25ed1433f2',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          address_2: '0xc07918e451ab77023a16fa7515dd60433a3c771d',
          address_3: '0x7bbf300890857b8c241b219c6a489431669b3afa',
          address_4: '0x1874c3e9d6e5f7e4f3f22c3e260c8b25ed1433f2',
        },
      },
    ];

    testCases.forEach((testCase) => {
      const { input, masksToValues, expectedOutput } = testCase;
      const result = unmaskAddresses(input, masksToValues);
      expect(result).toBe(expectedOutput);
    });
  });

  test('handles missing mappings gracefully', () => {
    const testCases: Array<UnmaskAddressesTestCase> = [
      {
        input: 'Send 100 KAVA to address_1',
        expectedOutput: 'Send 100 KAVA to address_1',
        masksToValues: {},
      },
      {
        input: 'Send 100 KAVA to address_1 and address_2',
        expectedOutput:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and address_2',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
    ];

    testCases.forEach((testCase) => {
      const { input, masksToValues, expectedOutput } = testCase;
      const result = unmaskAddresses(input, masksToValues);
      expect(result).toBe(expectedOutput);
    });
  });

  test('handles non-address text correctly', () => {
    const testCases: Array<UnmaskAddressesTestCase> = [
      {
        input: 'Send 100 KAVA to Binance',
        expectedOutput: 'Send 100 KAVA to Binance',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
      {
        input: 'Send 100 KAVA to kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
        expectedOutput:
          'Send 100 KAVA to kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
        masksToValues: {
          address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        },
      },
    ];

    testCases.forEach((testCase) => {
      const { input, masksToValues, expectedOutput } = testCase;
      const result = unmaskAddresses(input, masksToValues);
      expect(result).toBe(expectedOutput);
    });
  });
});
