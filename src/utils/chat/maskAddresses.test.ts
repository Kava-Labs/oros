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
    ];

    testCases.forEach((testCase) => {
      const { output, maskedValueMap } = maskAddresses(testCase);

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
      const { output, maskedValueMap } = maskAddresses(testCase);

      expect(output).toBe(testCase.input);
      expect(maskedValueMap).toStrictEqual({});
    });
  });
});
