import { InProgressTxDisplay } from '../../../../components/displayCards';
import {
  ChainMessage,
  ChainType,
  OperationType,
} from '../../../../types/chain';
import { WalletStore, WalletTypes } from '../../../../../../walletStore';

//  sent to model
interface LendToolParams {
  amount: string;
  denom: string;
}

/**
 * Implementation of the Kava Lend MsgDeposit message type.
 */
export class LendDepositMessage implements ChainMessage<LendToolParams> {
  name = 'msgDeposit';
  description = 'Deposit tokens from an address into a Lend money market';
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
      name: 'amount',
      type: 'string',
      description: 'Amount to send (in base units)',
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
    return InProgressTxDisplay;
  }
  /**
   * Validates that all required parameters are present and of correct type.
   * @param params - Parameters to validate
   * @returns True if parameters are valid
   */
  validate(params: LendToolParams, walletStore: WalletStore): boolean {
    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    const { amount, denom } = params;

    return Boolean(Number(amount) > 0 && denom.length > 0);
  }

  /**
   * Builds a Lend MsgDeposit transaction from the provided parameters.
   * @param params - Validated parameters for the transaction
   * @returns Transaction object ready for signing
   */
  async buildTransaction(
    params: LendToolParams,
    _walletStore: WalletStore,
  ): Promise<string> {
    console.log(params);

    return 'unimplemented';
  }
}
