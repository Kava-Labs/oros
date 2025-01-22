import { CosmosMessageBase } from '../.././cosmos/base';
import { CosmosCoin, CosmosMsg } from '../../../../../types/chain';
import { MessageTypeUrl } from '../../../../../types/messages';

//  sent to model
interface LendToolParams {
  depositor: string;
  amount: string;
  denom: string;
}

//  broadcast to chain
interface LendMsgArgs {
  depositor: string;
  amount: CosmosCoin;
}

/**
 * Implementation of the Kava Lend MsgDeposit message type.
 */
export class LendMsgDeposit extends CosmosMessageBase<LendToolParams> {
  type = 'hard/MsgDeposit';
  description = 'Deposit tokens from an address into a Lend money market';

  /**
   * Parameter definitions for the message.
   * Used for validation and OpenAI tool generation.
   */
  parameters = [
    {
      name: 'depositor',
      type: 'string',
      description: 'Depositor address',
      required: true,
    },
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

  /**
   * Validates that all required parameters are present and of correct type.
   * @param params - Parameters to validate
   * @returns True if parameters are valid
   */
  validate(params: LendToolParams): boolean {
    const { depositor, amount, denom } = params;

    return Boolean(
      depositor.length > 0 && Number(amount) > 0 && denom.length > 0,
    );
  }

  /**
   * Builds a Lend MsgDeposit transaction from the provided parameters.
   * @param params - Validated parameters for the transaction
   * @returns Transaction object ready for signing
   */
  async buildTransaction(
    params: LendToolParams,
  ): Promise<CosmosMsg<LendMsgArgs>> {
    const { depositor, amount, denom } = params;
    return {
      typeUrl: MessageTypeUrl.LEND_MSG_DEPOSIT,
      value: {
        depositor,
        amount: {
          amount,
          denom,
        },
      },
    };
  }
}
