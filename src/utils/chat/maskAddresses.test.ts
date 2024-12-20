import { maskAddresses } from './maskAddresses';

interface MaskedAddressTestCase {
  input: string;
  output: {
    result: string;
    maskedValueMap: Record<string, string>;
  };
}

describe('maskAddresses', () => {
  test('replaces address(es)', () => {
    const testCases: Array<MaskedAddressTestCase> = [
      {
        input: 'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        output: {
          result: 'Send 100 KAVA to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input: 'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5!',
        output: {
          result: 'Send 100 KAVA to <address_1>!',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input: 'Send 100 KAVA to0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        output: {
          result: 'Send 100 KAVA to<address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        output: {
          result: 'Send 100 KAVA and 0.01 wBTC to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dFFE5',
        output: {
          result: 'Send 100 KAVA to <address_1> and 0.01 wBTC to <address_1>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
          },
        },
      },
      {
        input:
          'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
        output: {
          result: 'Send 100 KAVA to <address_1> and 0.01 wBTC to <address_2>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
            address_2: '0xc07918e451ab77023a16fa7515dd60433a3c771d',
          },
        },
      },
      {
        input:
          'Send 10 KAVA to the following addresses: 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5, 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D, 0x7Bbf300890857b8c241b219C6a489431669b3aFA, 0x1874C3e9D6E5f7e4F3F22C3E260C8b25Ed1433f2',
        output: {
          result:
            'Send 10 KAVA to the following addresses: <address_1>, <address_2>, <address_3>, <address_4>',
          maskedValueMap: {
            address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
            address_2: '0xc07918e451ab77023a16fa7515dd60433a3c771d',
            address_3: '0x7bbf300890857b8c241b219c6a489431669b3afa',
            address_4: '0x1874c3e9d6e5f7e4f3f22c3e260c8b25ed1433f2',
          },
        },
      },
    ];

    testCases.forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase.input);

      expect(output).toBe(testCase.output.result);
      expect(maskedValueMap).toStrictEqual(testCase.output.maskedValueMap);
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
