import { erc20ABI } from '../../../utils/erc20ABI';
import { getERC20Record, getStoredMasks } from '../../../utils/chat/helpers';
import { InProgressTxDisplay } from '../../../components/displayCards';
import { ChainMessage, OperationType, ChainType } from '../../../types/chain';
import {
  SignatureTypes,
  WalletStore,
  WalletTypes,
} from '../../../stores/walletStore';
import {
  chainNameToolCallParam,
  chainRegistry,
  EVMChainConfig,
} from '../../../config/chainsRegistry';
import { ConnectWalletPrompt } from '../../../components/ConnectWalletPrompt';
import { validateChain, validateWallet } from '../../../utils/wallet';

interface SendToolParams {
  chainName: string;
  toAddress: string;
  amount: string;
  denom: string;
}

export class EvmTransferMessage implements ChainMessage<SendToolParams> {
  name = 'evm-transfer';
  description = 'Send erc20 tokens from one address to another';
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  needsWallet = [WalletTypes.METAMASK];
  walletMustMatchChainID = true;
  private hasValidWallet = false;

  parameters = [
    chainNameToolCallParam,
    {
      name: 'toAddress',
      type: 'string',
      description: 'Recipient address',
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to send',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
  ];

  inProgressComponent() {
    return this.hasValidWallet ? InProgressTxDisplay : ConnectWalletPrompt;
  }

  private async validateBalance(
    params: {
      denom: string;
      amount: string;
      chainName: string;
    },
    walletStore: WalletStore,
  ): Promise<boolean> {
    const { denom, amount, chainName } = params;

    const chain = chainRegistry[this.chainType][chainName];
    if (chain.chainType !== ChainType.EVM) {
      throw new Error(`chain Type must be ${ChainType.EVM} for this operation`);
    }

    const { erc20Contracts, nativeToken, rpcUrls, nativeTokenDecimals } = chain;

    const { ethers } = await import('ethers');

    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);
    const address = walletStore.getSnapshot().walletAddress;

    if (denom.toUpperCase() === nativeToken) {
      const rawBalance = await rpcProvider.getBalance(address);
      const formattedBalance = ethers.formatUnits(
        rawBalance,
        nativeTokenDecimals,
      );
      return Number(formattedBalance) >= Number(amount);
    }

    const erc20Record = getERC20Record(denom, erc20Contracts);
    if (!erc20Record) {
      return false;
    }

    const contract = new ethers.Contract(
      erc20Record.contractAddress,
      erc20ABI,
      rpcProvider,
    );

    const decimals = await contract.decimals();
    const rawBalance = await contract.balanceOf(address);
    const formattedBalance = ethers.formatUnits(rawBalance, decimals);

    return Number(formattedBalance) >= Number(amount);
  }

  async validate(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<boolean> {
    this.hasValidWallet = false;

    validateWallet(walletStore, this.needsWallet);
    validateChain(this.chainType, params.chainName);

    //  wallet checks have passed
    this.hasValidWallet = true;

    const { toAddress, amount, denom } = params;

    const { masksToValues } = getStoredMasks();

    const validToAddress = masksToValues[toAddress] ?? '';
    if (!validToAddress.length) {
      throw new Error(`please provide a valid address to send to`);
    }

    if (Number(amount) <= 0) {
      throw new Error(`amount must be greater than zero`);
    }

    const { erc20Contracts, nativeToken } = chainRegistry[this.chainType][
      params.chainName
    ] as EVMChainConfig;

    const validDenomWithContract =
      getERC20Record(denom, erc20Contracts) !== null ||
      denom.toUpperCase() === nativeToken;

    if (!validDenomWithContract) {
      throw new Error(`failed to find contract address for ${denom}`);
    }

    if (!(await this.validateBalance(params, walletStore))) {
      throw new Error('Invalid balances for transaction');
    }

    return true;
  }

  async buildTransaction(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { ethers } = await import('ethers');
    const { toAddress, amount, denom } = params;

    const { erc20Contracts, rpcUrls, nativeToken, chainID } = chainRegistry[
      this.chainType
    ][params.chainName] as EVMChainConfig;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    try {
      let txParams: Record<string, string>;

      const { masksToValues } = getStoredMasks();

      //  validate method will check that these mask-addresses exist
      const addressTo = masksToValues[toAddress];
      const addressFrom = walletStore.getSnapshot().walletAddress;

      const receivingAddress = ethers.getAddress(addressTo);
      const sendingAddress = ethers.getAddress(addressFrom);

      if (denom.toUpperCase() === nativeToken) {
        txParams = {
          to: receivingAddress,
          data: '0x',
          value: ethers.parseEther(amount).toString(16),
        };
      } else {
        // ! because this already passed validation
        const { contractAddress } = getERC20Record(denom, erc20Contracts)!;

        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          rpcProvider,
        );
        const decimals = await contract.decimals();
        const formattedTxAmount = ethers.parseUnits(amount, Number(decimals));

        txParams = {
          to: contractAddress,
          value: '0', // this must be zero
          data: contract.interface.encodeFunctionData('transfer', [
            receivingAddress,
            formattedTxAmount,
          ]),
        };
      }

      const hash = await walletStore.sign({
        chainId: `0x${Number(chainID).toString(16)}`,
        signatureType: SignatureTypes.EVM,
        payload: {
          method: 'eth_sendTransaction',
          params: [
            {
              ...txParams,
              from: sendingAddress,
              gasPrice: '0x4a817c800',
              gas: '0x16120',
            },
          ],
        },
      });

      try {
        const timeout = 20000; // upto 20 seconds
        const confirmations = 1;
        await rpcProvider.waitForTransaction(hash, confirmations, timeout);
      } catch (err) {
        console.error(err);
      }

      return hash;
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
