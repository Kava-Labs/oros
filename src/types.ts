export interface WalletConnectionPayloadV1 {
  address: string;
  chainID: string;
}

export type MessagePayloads = {
  'WALLET_CONNECTION/V1': WalletConnectionPayloadV1;
};

export type IFrameMessage<T extends keyof MessagePayloads> = {
  namespace: 'KAVA_CHAT';
  type: T;
  payload: MessagePayloads[T];
};

export type AnyIFrameMessage = IFrameMessage<'WALLET_CONNECTION/V1'>;
