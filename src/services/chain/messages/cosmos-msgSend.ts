import { CosmosMessageBase } from './cosmos/base';
import { CosmosCoin, CosmosMsg } from '../../../types/chain';

interface SendMsgToolParams {
  fromAddress: string;
  toAddress: string;
  amount: string;
  denom: string;
}

interface SendMsgValue {
  fromAddress: string;
  toAddress: string;
  amount: CosmosCoin;
}

/**
 * Implementation of the Cosmos SDK MsgSend message type.
 * Handles the creation and validation of token transfer messages
 * in the Cosmos ecosystem.
 */
export class CosmosSendMessage extends CosmosMessageBase<SendMsgToolParams> {
  type = 'cosmos-sdk/MsgSend';
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
  validate(params: SendMsgToolParams): boolean {
    const { fromAddress, toAddress, amount, denom } = params;

    return Boolean(
      fromAddress.length > 0 &&
        toAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0,
    );
  }

  /**
   * Builds a Cosmos SDK MsgSend transaction from the provided parameters.
   * @param params - Validated parameters for the transaction
   * @returns Transaction object ready for signing
   */
  async buildTransaction(
    params: SendMsgToolParams,
  ): Promise<CosmosMsg<SendMsgValue>> {
    const { fromAddress, toAddress, amount, denom } = params;
    return {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress,
        toAddress,
        amount: {
          amount,
          denom,
        },
      },
    };
  }
}
