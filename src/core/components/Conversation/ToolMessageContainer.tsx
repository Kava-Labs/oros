import { useAppContext } from '../../context/useAppContext';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../../../features/blockchain/config/chainsRegistry';
import {
  OperationResult,
  OperationType,
} from '../../../features/blockchain/types/chain';
import {
  CompleteQueryDisplay,
  CompleteTxDisplay,
} from '../../../features/blockchain/components/displayCards';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';

export interface ToolMessageContainerProps {
  message: ChatCompletionToolMessageParam;
  prevMessage: ChatCompletionAssistantMessageParam;
  onRendered: () => void;
}

export const ToolMessageContainer = ({
  message,
  prevMessage,
  onRendered,
}: ToolMessageContainerProps) => {
  const { registry } = useAppContext();

  const id = message.tool_call_id;

  // Check if the previous message is valid
  if (
    !(
      prevMessage.role === 'assistant' &&
      prevMessage.content === null &&
      Array.isArray(prevMessage.tool_calls)
    )
  ) {
    return null;
  }

  const tc = prevMessage.tool_calls.find(
    (tc: ChatCompletionMessageToolCall) => tc.id === id,
  );
  if (!tc) return null;

  const params = JSON.parse(tc.function.arguments);
  if (
    typeof params === 'object' &&
    params !== null &&
    chainNameToolCallParam.name in params
  ) {
    const chainName = params[chainNameToolCallParam.name];
    const operation = registry.get(tc.function.name);
    if (!operation) return null;

    const chain = chainRegistry[operation.chainType][chainName];
    const content: OperationResult = JSON.parse(message.content as string);

    if (content.status !== 'ok') {
      return null;
    }

    if (operation.operationType === OperationType.QUERY) {
      return (
        <CompleteQueryDisplay content={content.info} onRendered={onRendered} />
      );
    } else {
      return <CompleteTxDisplay hash={content.info} chain={chain} />;
    }
  }

  return null;
};
