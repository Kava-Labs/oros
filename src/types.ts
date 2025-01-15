import type { ChatCompletionTool } from 'openai/resources/index';
import { ToolCallStream } from './toolCallStreamStore';

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

export interface SetIntroTextPayloadV1 {
  introText: string;
}

export interface ToolCallResponsePayloadV1 {
  toolCall: ToolCallStream; // the tool call
  content: string; // tool call response string
}

export interface SetProgressStorePayloadV1 {
  text: string;
}

export interface SetCautionTextPayloadV1 {
  cautionText: string;
}

// Map the type property to specific payloads
export type MessagePayloads = {
  'WALLET_CONNECTION/V1': WalletConnectionPayloadV1;
  'SET_SYSTEM_PROMPT/V1': SetSystemPromptPayloadV1;
  'SET_TOOLS/V1': SetToolsPayloadV1;
  'SET_INTRO_TEXT/V1': SetIntroTextPayloadV1;
  'TOOL_CALL_RESPONSE/V1': ToolCallResponsePayloadV1;
  'SET_PROGRESS_TEXT/V1': SetProgressStorePayloadV1;
  'SET_CAUTION_TEXT/V1': SetCautionTextPayloadV1;
};

// Main message type
export type IFrameMessage<T extends keyof MessagePayloads> = {
  namespace: 'KAVA_CHAT';
  type: T;
  payload: MessagePayloads[T];
};

export type AnyIFrameMessage =
  | IFrameMessage<'WALLET_CONNECTION/V1'>
  | IFrameMessage<'SET_TOOLS/V1'>
  | IFrameMessage<'SET_SYSTEM_PROMPT/V1'>
  | IFrameMessage<'SET_INTRO_TEXT/V1'>
  | IFrameMessage<'TOOL_CALL_RESPONSE/V1'>
  | IFrameMessage<'SET_PROGRESS_TEXT/V1'>
  | IFrameMessage<'SET_CAUTION_TEXT/V1'>;
