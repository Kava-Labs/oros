import { CosmosMessageBase } from './base';
import { TransactionDisplay } from '../../../../components/InProgressTxDisplay';

interface SendToolParams {
  fromAddress: string;
  toAddress: string;
  amount: string;
  denom: string;
}

/**
 * Implementation of the Cosmos SDK MsgSend message type.
 * Handles the creation and validation of token transfer messages
 * in the Cosmos ecosystem.
 */
export class CosmosSendMessage extends CosmosMessageBase<SendToolParams> {
  name = 'msgSend';
  /** Human-readable description for AI tools */
  description = 'Send tokens from one address to another';

  /**
   * Parameter definitions for the message.
   * Used for validation and OpenAI tool generation.
   */
  parameters = [
    {
      name: 'fromAddress',
      type: 'string',
      description: 'Sender address',
      required: true,
    },
    {
      name: 'toAddress',
      type: 'string',
      description: 'Recipient address',
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
  validate(params: SendToolParams): boolean {
    const { fromAddress, toAddress, amount, denom } = params;

    return Boolean(
      fromAddress.length > 0 &&
        toAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0,
    );
  }

  inProgressComponent() {
    return TransactionDisplay;
  }

  /**
   * Builds a Cosmos SDK MsgSend transaction from the provided parameters.
   * @param params - Validated parameters for the transaction
   * @returns Transaction object ready for signing
   */
  async buildTransaction(params: SendToolParams): Promise<string> {
    console.log(params);
    return 'Unimplemented';
  }
}
