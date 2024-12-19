export interface TestCase {
  description?: string;
  input: string;
  result: {
    output: string;
    tokenMap: { [key: string]: string };
  } | null;
}

export const happyPathCases: Array<TestCase> = [
  {
    input: 'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
      },
    },
  },
  {
    input: 'Send 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 100 KAVA ',
    result: {
      output: 'Send <address_1> <amount_1> <token_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
      },
    },
  },
  {
    input: 'Send 100.001 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100.001',
        token_1: 'KAVA',
      },
    },
  },
  {
    input: 'Send 0.9 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '0.9',
        token_1: 'KAVA',
      },
    },
  },
  {
    input: 'Send .9 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '.9',
        token_1: 'KAVA',
      },
    },
  },
  {
    input:
      'Send 1,000 KAVA tokens to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '1,000',
        token_1: 'KAVA',
      },
    },
  },
  {
    input:
      'Send 1,000.00 KAVA tokens to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '1,000.00',
        token_1: 'KAVA',
      },
    },
  },
  {
    input:
      'Send 1,000.123456 KAVA tokens to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output: 'Send <amount_1> <token_1> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '1,000.123456',
        token_1: 'KAVA',
      },
    },
  },
  {
    description: 'one address, multiple txs',
    input:
      'Send 100 KAVA and 0.01 wBTC to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: {
      output:
        'Send <amount_1> <token_1> and <amount_2> <token_2> to <address_1>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
        amount_2: '0.01',
        token_2: 'wBTC',
      },
    },
  },
  {
    description: 'one address, multiple txs',
    input:
      'Send 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 100 KAVA and 0.01 wBTC',
    result: {
      output: 'Send <address_1> <amount_1> <token_1> and <amount_2> <token_2>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
        amount_2: '0.01',
        token_2: 'wBTC',
      },
    },
  },
  {
    description: 'multiple addresses and txs',
    input:
      'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 and 0.01 wBTC to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
    result: {
      output:
        'Send <amount_1> <token_1> to <address_1> and <amount_2> <token_2> to <address_2>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
        address_2: '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
        amount_2: '0.01',
        token_2: 'wBTC',
      },
    },
  },
  {
    description: 'multiple addresses and txs',
    input:
      'Send 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 100 KAVA and 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D 0.01 wBTC',
    result: {
      output:
        'Send <address_1> <amount_1> <token_1> and <address_2> <amount_2> <token_2>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
        address_2: '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
        amount_2: '0.01',
        token_2: 'wBTC',
      },
    },
  },
  {
    description: 'multiple addresses and txs',
    input:
      'Send 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5 100 KAVA and 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D 0.01 wBTC',
    result: {
      output:
        'Send <address_1> <amount_1> <token_1> and <address_2> <amount_2> <token_2>',
      tokenMap: {
        address_1: '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
        amount_1: '100',
        token_1: 'KAVA',
        address_2: '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
        amount_2: '0.01',
        token_2: 'wBTC',
      },
    },
  },
];

export const failureTestCases: Array<TestCase> = [
  {
    description: 'No number present',
    input: 'Send KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Zero not allowed',
    input: 'Send 0 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Negative number for amount',
    input: 'Send -100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Too small',
    input:
      'Send 0.000000000000000000000000000001 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Too great',
    input:
      'Send 123456789123456789123456789 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Malformed number',
    input: 'Send 127.0.0.1 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Hexidecmial',
    input: 'Send 0x KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Alphanumerical',
    input: 'Send 123a4 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Single decimal',
    input: 'Send . KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Trailing decimal',
    input: 'Send 1. KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Unexpected character in amount',
    input: 'Send $100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Unexpected character in amount',
    input: 'Send Infinity KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Unexpected character in amount',
    input: 'Send 2/3 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Unexpected character in amount',
    input:
      'Send 1-800-588-2300 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Non-parseable value',
    input: 'Send null KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Non-parseable value',
    input: 'Send NaN KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Non-parseable value',
    input:
      'Send Number.MAX_VALUE KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Improper formatting',
    input: 'Send 1,00 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Improper formatting',
    input: 'Send 1,000,00 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'Improper formatting',
    input: 'Send 1.000,000 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5',
    result: null,
  },
  {
    description: 'non-0x address',
    input: 'Send 100 KAVA to 0x123',
    result: null,
  },
  {
    description: 'non-0x address',
    input: 'Send 100 KAVA to kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
    result: null,
  },
  {
    description: 'non-0x address',
    input:
      'Send 100 KAVA to 0xd8e30f7bcb5211e591bbc463cdab0144e82dffe500000000000000000000000',
    result: null,
  },
];
