import { maskAddresses } from './maskAddresses';

interface MaskedAddressTestCase {
  input: string;
  result: {
    output: string;
    maskedValueMap: Record<string, string>;
  };
}

describe('maskAddresses', () => {
  test('replaces address(es)', () => {
    const testCases: Array<MaskedAddressTestCase> = [
      {
        input: 'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        result: {
          output: 'Send 100 KAVA to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        result: {
          output: 'Send 100 KAVA and 0.01 wBTC to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        result: {
          output: 'Send 100 KAVA to <address_1> and 0.01 wBTC to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
        result: {
          output: 'Send 100 KAVA to <address_1> and 0.01 wBTC to <address_2>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
            address_2: '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
          },
        },
      },
      {
        input:
          'Send 10 KAVA to the following addresses: 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5, 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D, 0x7Bbf300890857b8c241b219C6a489431669b3aFA, 0x1874C3e9D6E5f7e4F3F22C3E260C8b25Ed1433f2',
        result: {
          output:
            'Send 10 KAVA to the following addresses: <address_1>, <address_2>, <address_3>, <address_4>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
            address_2: '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
            address_3: '0x7Bbf300890857b8c241b219C6a489431669b3aFA',
            address_4: '0x1874C3e9D6E5f7e4F3F22C3E260C8b25Ed1433f2',
          },
        },
      },
    ];

    testCases.forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase.input);

      expect(output).toBe(testCase.result.output);
      expect(maskedValueMap).toStrictEqual(testCase.result.maskedValueMap);
    });
  });

  test('no processing for failure cases', () => {
    const testCases = [
      {
        input: 'Send 100 KAVA to kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
        result: {
          output:
            'Send 100 KAVA to kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
          maskedValueMap: {},
        },
      },
      {
        input: 'Send 100 KAVA to Binance',
        result: {
          output: 'Send 100 KAVA to Binance',
          maskedValueMap: {},
        },
      },
      {
        input:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe500000000000000000000000',
        result: {
          output:
            'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe500000000000000000000000',
          maskedValueMap: {},
        },
      },
    ];
    testCases.forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase.input);

      expect(output).toBe(testCase.input);
      expect(maskedValueMap).toStrictEqual({});
    });
  });
});
