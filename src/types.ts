export interface WalletConnectionPayloadV1 {
  address: string;
  chainID: string;
}

export interface UIAutomationPayloadV1 {
  commands: {
    action:
      | 'NAVIGATE'
      | 'CLICK_TEST_ID'
      | 'FILL_AMOUNT'
      | 'FILL_ADDRESS'
      | 'INITIATE_TX';
    path?: string;
    targetId?: string;
  }[];
}

export type MessagePayloads = {
  'WALLET_CONNECTION/V1': WalletConnectionPayloadV1;
  'UI_AUTOMATION/V1': UIAutomationPayloadV1;
};

export type IFrameMessage<T extends keyof MessagePayloads> = {
  namespace: 'KAVA_CHAT';
  type: T;
  payload: MessagePayloads[T];
};

export type AnyIFrameMessage = IFrameMessage<'WALLET_CONNECTION/V1'>;
