export enum MessageTypeUrl {
  COSMOS_MSG_SEND = '/cosmos.bank.v1beta1.MsgSend',
  LEND_MSG_DEPOSIT = '/kava.hard.v1beta1.MsgDeposit',
}

/**
 * Defines a parameter for chain operations (messages or queries).
 * Used to validate inputs and generate OpenAI tool definitions.
 *
 * This might be too abstracted?
 */
export interface MessageParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface CosmosMsg<T> {
  typeUrl: string;
  value: T;
}

export interface CosmosCoin {
  amount: string;
  denom: string;
}
