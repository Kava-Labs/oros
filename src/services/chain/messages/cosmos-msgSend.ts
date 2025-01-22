import { ChainMessage } from '../../../types/chain';

/**
 * Implementation of the Cosmos SDK MsgSend message type.
 * Handles the creation and validation of token transfer messages
 * in the Cosmos ecosystem.
 */
export class CosmosSendMessage implements ChainMessage {
  type = 'cosmos-sdk/MsgSend';
  /** Identifies this as a transaction operation vs query */
  operationType = 'transaction' as const;
  /** Specifies this as a Cosmos chain operation not evm */
  chainType = 'cosmos' as const;
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
  validate(params: unknown): boolean {
    return (
      // @ts-expect-error todo: better types needed
      params.fromAddress && params.toAddress && params.amount && params.denom
    );
  }

  /**
   * Builds a Cosmos SDK MsgSend transaction from the provided parameters.
   * @param params - Validated parameters for the transaction
   * @returns Transaction object ready for signing
   */
  async buildTransaction(params: unknown): Promise<unknown> {
    /**
     * TODO: This could utilize some of our helpers like buildCoin and our explicit
     *       typings for this message type
     */

    return {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        // @ts-expect-error todo: better types needed
        fromAddress: params.fromAddress,
        // @ts-expect-error todo: better types needed
        toAddress: params.toAddress,
        amount: [
          {
            // @ts-expect-error todo: better types needed
            amount: params.amount,
            // @ts-expect-error todo: better types needed
            denom: params.denom,
          },
        ],
      },
    };
  }
}
