import { ChainType } from '../types/chain';

export type ChainRegistry = Record<
  ChainType,
  Record<
    string,
    {
      name: string;
      rpcUrl: string;
      chainID: number;
      erc20Contracts: Record<
        string,
        { contractAddress: string; displayName: string }
      >;
    }
  >
>;

export const chainRegistry: ChainRegistry = {
  [ChainType.EVM]: {
    kavaEVM: {
      name: 'kavaEVM',
      rpcUrl: 'https://evm.kava-rpc.com',
      chainID: 2222,

      erc20Contracts: {
        WHARD: {
          contractAddress: '0x25e9171C98Fc1924Fa9415CF50750274F0664764',
          displayName: 'wHARD',
        },
        USDT: {
          contractAddress: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
          displayName: 'USD₮',
        },
        WKAVA: {
          contractAddress: '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
          displayName: 'wKAVA',
        },
        AXLETH: {
          contractAddress: '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',
          displayName: 'axlETH',
        },
        AXLWBTC: {
          contractAddress: '0x1a35EE4640b0A3B87705B0A4B45D227Ba60Ca2ad',
          displayName: 'axlwBTC',
        },
        AXLUSDC: {
          contractAddress: '0xEB466342C4d449BC9f53A865D5Cb90586f405215',
          displayName: 'axlUSDC',
        },
        AXLDAI: {
          contractAddress: '0x5C7e299CF531eb66f2A1dF637d37AbB78e6200C7',
          displayName: 'axlDAI',
        },
        AXLUSDT: {
          contractAddress: '0x7f5373AE26c3E8FfC4c77b7255DF7eC1A9aF52a6',
          displayName: 'axlUSDT',
        },
        WATOM: {
          contractAddress: '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3',
          displayName: 'wATOM',
        },
        AXLBNB: {
          contractAddress: '0x23A6486099f740B7688A0bb7AED7C912015cA2F0',
          displayName: 'axlBNB',
        },
        AXLBUSD: {
          contractAddress: '0x4D84E25cEa9447581867fE9f2329B972f532Da2c',
          displayName: 'axlBUSD',
        },
        AXLXRPB: {
          contractAddress: '0x8e20A0a1B4664D1ae5d18cc48bA6FAD4d9569406',
          displayName: 'axlXRPB',
        },
        AXLBTCB: {
          contractAddress: '0x94FC70EF7791EE857A1f420B9A471a55F32382be',
          displayName: 'axlBTCB',
        },
        WBTC: {
          contractAddress: '0xb5c4423a65B953905949548276654C96fcaE6992',
          displayName: 'wBTC',
        },
        MBTC: {
          contractAddress: '0x59889b7021243dB5B1e065385F918316cD90D46c',
          displayName: 'mBTC',
        },
      },
    },
  },
  [ChainType.COSMOS]: {},
};

export const chainNameToolCallParam = {
  name: 'chainName',
  type: 'string',
  description:
    'name of the chain the user is interacting with, if not specified by the user assume kavaEVM',
  enum: Object.keys(chainRegistry),
  required: true,
};
