export interface WalletConnectionPayload {
  address: string;
  walletName: string;
  chainID: string;
}

// Map the type property to specific payloads
export type MessagePayloads = {
  'WALLET_CONNECTION/V1': WalletConnectionPayload;
};

// Main message type
export type IFrameMessage<T extends keyof MessagePayloads> = {
  namespace: 'KAVA_CHAT';
  type: T;
  payload: MessagePayloads[T];
};

// union type of all possible messages (only one exists now)
export type AnyIFrameMessage = IFrameMessage<'WALLET_CONNECTION/V1'>;
