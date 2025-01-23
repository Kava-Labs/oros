import { CosmosMessageBase } from '../../cosmos/base';
import { InProgressTxDisplay } from '../../../../../components/InProgressTxDisplay';

//  sent to model
interface LendToolParams {
  depositor: string;
  amount: string;
  denom: string;
}

/**
 * Implementation of the Kava Lend MsgDeposit message type.
 */
export class LendDepositMessage extends CosmosMessageBase<LendToolParams> {
  name = 'msgDeposit';
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

  inProgressComponent() {
    return InProgressTxDisplay;
  }
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
  async buildTransaction(params: LendToolParams): Promise<string> {
    console.log(params);

    return 'unimplemented';
  }
}
