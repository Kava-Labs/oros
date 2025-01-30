import Kava from '@kava-labs/javascript-sdk';
import { InProgressTxDisplay } from '../../../../../components/InProgressTxDisplay';
import {
  ChainNames,
  chainRegistry,
  CosmosChainConfig,
  EVMChainConfig,
} from '../../../../../config/chainsRegistry';
import {
  ChainMessage,
  ChainType,
  OperationType,
} from '../../../../../types/chain';
import {
  getCoinRecord,
  getERC20Record,
} from '../../../../../utils/chat/helpers';
import {
  SignatureTypes,
  WalletStore,
  WalletTypes,
} from '../../../../../walletStore';
import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import { erc20ABI } from '../../../../../tools/erc20ABI';
import { EIP712SignerParams } from '../../../../../eip712';
import { walletStore } from '../../../../../stores';
import { Message } from '@kava-labs/javascript-sdk/lib/types/Message';

interface ERC20ConvertParams {
  chainName: string;
  amount: string;
  denom: string;
  direction: 'coinToERC20' | 'ERC20ToCoin';
}

export class ERC20ConversionMessage
  implements ChainMessage<ERC20ConvertParams>
{
  name = 'erc20Convert';
  description =
    'Converts an ERC20 asset to a cosmos Coin or cosmos coin to an ERC20 asset';
  chainType = ChainType.COSMOS;
  operationType = OperationType.TRANSACTION;
  walletMustMatchChainID = true;

  needsWallet = [WalletTypes.METAMASK];

  /**
   * Parameter definitions for the message.
   * Used for validation and OpenAI tool generation.
   */
  parameters = [
    {
      name: 'chainName',
      type: 'string',
      description: `name of the chain the user is interacting with, if not specified by the user assume ${ChainNames.KAVA_COSMOS}`,
      enum: [...Object.keys(chainRegistry[ChainType.COSMOS])],
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to convert',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
    {
      name: 'direction',
      type: 'string',
      description:
        'direction of the conversion either from cosmos Coin to erc20 or erc20 to cosmos Coin',
      enum: ['coinToERC20', 'ERC20ToCoin'],
      required: true,
    },
  ];

  inProgressComponent() {
    return InProgressTxDisplay;
  }

  validate(params: ERC20ConvertParams, walletStore: WalletStore): boolean {
    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    if (!chainRegistry[this.chainType][params.chainName]) {
      throw new Error(`unknown chain name ${params.chainName}`);
    }

    const { amount, denom } = params;

    if (Number(amount) <= 0) {
      throw new Error(`amount must be greater than zero`);
    }

    const chainInfo = chainRegistry[this.chainType][params.chainName];

    if (chainInfo.chainType !== ChainType.COSMOS) {
      throw new Error('chain Type must be Cosmos for this operation');
    }

    if (
      !chainInfo.evmChainName ||
      !chainRegistry[ChainType.EVM][chainInfo.evmChainName ?? '']
    ) {
      throw new Error(
        `cosmos chain ${chainInfo.name} must be linked to an EVM chain`,
      );
    }

    const { erc20Contracts } = chainRegistry[ChainType.EVM][
      chainInfo.evmChainName
    ] as EVMChainConfig;

    if (
      !getERC20Record(denom, erc20Contracts) ||
      !getCoinRecord(denom, chainInfo.denoms)
    ) {
      throw new Error(
        `failed to find contract address or coin record for ${denom}`,
      );
    }

    if (
      params.direction !== 'ERC20ToCoin' &&
      params.direction !== 'coinToERC20'
    ) {
      throw new Error(`unknown conversion direction ${params.direction}`);
    }

    return true;
  }

  async buildTransaction(
    params: ERC20ConvertParams,
    _walletStore: WalletStore,
  ): Promise<string> {
    const cosmosChainConfig = chainRegistry[this.chainType][
      params.chainName
    ] as CosmosChainConfig;

    const evmChainConfig = chainRegistry[ChainType.EVM][
      cosmosChainConfig.evmChainName!
    ] as EVMChainConfig;

    const { contractAddress } = getERC20Record(
      params.denom,
      evmChainConfig.erc20Contracts,
    )!;

    const rpcProvider = new ethers.JsonRpcProvider(evmChainConfig.rpcUrls[0]);

    const signerAddress = ethers.getAddress(
      walletStore.getSnapshot().walletAddress,
    );

    const bech32Address = bech32.encode(
      cosmosChainConfig.bech32Prefix,
      bech32.toWords(ethers.getBytes(ethers.toQuantity(signerAddress))),
    );

    const contract = new ethers.Contract(
      contractAddress,
      erc20ABI,
      rpcProvider,
    );

    const microAmount = ethers
      .parseUnits(params.amount, await contract.decimals())
      .toString();

    const messages: Message<unknown>[] = [];

    switch (params.direction) {
      case 'ERC20ToCoin': {
        messages.push(
          Kava.msg.evmutil.newMsgConvertERC20ToCoin(
            signerAddress,
            bech32Address,
            contractAddress,
            microAmount,
          ),
        );
        break;
      }
      case 'coinToERC20': {
        messages.push(
          Kava.msg.evmutil.newMsgConvertCoinToERC20(
            bech32Address,
            signerAddress,
            {
              denom: getCoinRecord(params.denom, cosmosChainConfig.denoms)!
                .denom,
              amount: microAmount,
            },
          ),
        );

        break;
      }
      default: {
        throw new Error(`unknown conversion direction ${params.direction}`);
      }
    }

    const payload: EIP712SignerParams = {
      messages,
      chainConfig: cosmosChainConfig,
      memo: '',
      fee: [
        {
          denom: cosmosChainConfig.nativeToken,
          amount: String(Number(cosmosChainConfig.defaultGasWanted) * 0.025),
        },
      ],
    };

    const hash = await walletStore.sign({
      signatureType: SignatureTypes.EIP712,
      payload,
      chainId: `0x${Number(evmChainConfig.chainID).toString(16)}`,
    });

    return hash;
  }
}
