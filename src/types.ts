import type { ChatCompletionTool } from 'openai/resources/index';

export interface WalletConnectionPayloadV1 {
  address: string;
  walletName: string;
  chainID: string;
}

export interface SetSystemPromptPayloadV1 {
  systemPrompt: string;
}

export interface SetToolsPayloadV1 {
  tools: ChatCompletionTool[];
}

export interface SetIntroTextV1 {
  introText: string;
}

// Map the type property to specific payloads
export type MessagePayloads = {
  'WALLET_CONNECTION/V1': WalletConnectionPayloadV1;
  'SET_SYSTEM_PROMPT/V1': SetSystemPromptPayloadV1;
  'SET_TOOLS/V1': SetToolsPayloadV1;
  'SET_INTRO_TEXT/v1': SetIntroTextV1;
};

// Main message type
export type IFrameMessage<T extends keyof MessagePayloads> = {
  namespace: 'KAVA_CHAT';
  type: T;
  payload: MessagePayloads[T];
};

// union type of all possible messages (only one exists now)
export type AnyIFrameMessage =
  | IFrameMessage<'WALLET_CONNECTION/V1'>
  | IFrameMessage<'SET_TOOLS/V1'>
  | IFrameMessage<'SET_SYSTEM_PROMPT/V1'>
  | IFrameMessage<'SET_INTRO_TEXT/v1'>;
