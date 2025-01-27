import { ChainType } from '../types/chain';

export type ERC20Record = { contractAddress: string; displayName: string };

type EVMChainConfig = {
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  chainID: number;
  nativeToken: string;
  nativeTokenDecimals: number;
  erc20Contracts: Record<string, ERC20Record>;
};

export type ChainConfig = EVMChainConfig;

export type ChainRegistry = Record<ChainType, Record<string, ChainConfig>>;

export enum ChainNames {
  KAVA_EVM = 'kavaEVM',
  ETH = 'eth',
  KAVA_EVM_INTERNAL_TESTNET = 'kavaEVMInternalTestnet',
}

export const chainRegistry: ChainRegistry = {
  [ChainType.EVM]: {
    [ChainNames.KAVA_EVM]: {
      name: ChainNames.KAVA_EVM,
      rpcUrls: ['https://evm.kava-rpc.com'],
      chainID: 2222,
      nativeToken: 'KAVA',
      nativeTokenDecimals: 18,
      blockExplorerUrls: ['https://kavascan.com/'],

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
    [ChainNames.KAVA_EVM_INTERNAL_TESTNET]: {
      name: ChainNames.KAVA_EVM_INTERNAL_TESTNET,
      rpcUrls: ['https://evm.data.internal.testnet.us-east.production.kava.io'],
      chainID: 2221,
      nativeToken: 'TKAVA',
      nativeTokenDecimals: 18,
      blockExplorerUrls: ['https://kavascan.com/'],
      erc20Contracts: {
        WHARD: {
          contractAddress: '0x25e9171C98Fc1924Fa9415CF50750274F0664764',
          displayName: 'wHARD',
        },
        USDT: {
          contractAddress: '0xaCF81e57CBd9aF95FaBbe53678FcB70B1dD1b7A1',
          displayName: 'USD₮',
        },
        WKAVA: {
          contractAddress: '0x70C79B608aBBC502c2F61f38E04190fB407BefCF',
          displayName: 'wKAVA',
        },
        AXLETH: {
          contractAddress: '0x5d6D67a665C9F169B0f9436E05B11108C1606043',
          displayName: 'axlETH',
        },
        AXLWBTC: {
          contractAddress: '0x7d2Ee2914324d5D4dC33A5c295E720659D5F3fA7',
          displayName: 'axlwBTC',
        },
        AXLUSDC: {
          contractAddress: '0x7a5DBf8e6ac1F6aCCF14f5B4E88b21EAA04c983d',
          displayName: 'axlUSDC',
        },
        AXLDAI: {
          contractAddress: '0xAa03872057AD496Bd6f3eE85b85e1e4DABdb1a5d',
          displayName: 'axlDAI',
        },
        AXLUSDT: {
          contractAddress: '0xA637F4CECbA91Ad19075bA3d330cd95f694B1707',
          displayName: 'axlUSDT',
        },
        WATOM: {
          contractAddress: '0x15932E26f5BD4923d46a2b205191C4b5d5f43FE3',
          displayName: 'wATOM',
        },
        AXLBNB: {
          contractAddress: '0x102dF7764fe9F0eFa850A07e25D5171d19bC7862',
          displayName: 'axlBNB',
        },
        AXLBUSD: {
          contractAddress: '0xB1f5FC6633BC2d67EC9B072FB1570Ea8adE02A22',
          displayName: 'axlBUSD',
        },
        AXLXRPB: {
          contractAddress: '0xd8DaCA0CA6F88a3a3B7dF15A26483254d80E8726',
          displayName: 'axlXRPB',
        },
        AXLBTCB: {
          contractAddress: '0x9920E05F1f5B0280fe2Fe32B758F3Dbd534A5480',
          displayName: 'axlBTCB',
        },
        WBTC: {
          contractAddress: '0x4ef4e7b4281e813Bf0FED39728E025D01c3e76AC',
          displayName: 'wBTC',
        },
        MBTC: {
          contractAddress: '0x59889b7021243dB5B1e065385F918316cD90D46c',
          displayName: 'mBTC',
        },
      },
    },
    [ChainNames.ETH]: {
      name: ChainNames.ETH,
      chainID: 1,
      nativeToken: 'ETH',
      nativeTokenDecimals: 18,
      rpcUrls: ['https://eth.drpc.org'],
      blockExplorerUrls: ['https://etherscan.io/'],
      erc20Contracts: {
        // USDT: {
        //   contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        //   displayName: 'USD₮',
        // },
        // USDC: {
        //   contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        //   displayName: 'USDC',
        // },
        // DAI: {
        //   contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        //   displayName: 'DAI',
        // }
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
  enum: [
    ...Object.keys(chainRegistry[ChainType.EVM]),
    ...Object.keys(chainRegistry[ChainType.COSMOS]),
  ],
  required: true,
};
