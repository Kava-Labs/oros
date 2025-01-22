import { CosmosMessageBase } from './cosmos/base';
import { CosmosCoin, CosmosMsg } from '../../../types/chain';

interface LendMsgToolParams {
  depositor: string;
  amount: string;
  denom: string;
}

interface MsgDepositValue {
  depositor: string;
  amount: CosmosCoin;
}

/**
 * Implementation of the Kava Lend MsgDeposit message type.
 */
export class LendMsgDeposit extends CosmosMessageBase<LendMsgToolParams> {
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
  validate(params: LendMsgToolParams): boolean {
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
    params: LendMsgToolParams,
  ): Promise<CosmosMsg<MsgDepositValue>> {
    const { depositor, amount, denom } = params;
    return {
      typeUrl: '/kava.hard.v1beta1.MsgDeposit',
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
