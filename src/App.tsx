import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { ChatView } from './components/ChatView';
import { getToken } from './utils/token/token';
import OpenAI from 'openai';
import {
  messageHistoryStore,
  messageStore,
  progressStore,
  toolCallStreamStore,
} from './store';
import type { ChatCompletionTool } from 'openai/resources/index';
import {
  isContentChunk,
  isToolCallChunk,
  assembleToolCallsFromStream,
} from './streamUtils';
import { TextStreamStore } from './textStreamStore';
import {
  memeCoinSystemPrompt,
  memeCoinGenIntroText,
  memeCoinGenWarningText,
} from './config/prompts/systemPrompt';
import { memeCoinTools } from './config/tools';
// import { imagedb } from './imagedb';
// import { v4 as uuidv4 } from 'uuid';
import { ToolCallStream, ToolCallStreamStore } from './toolCallStreamStore';
// import { ToolFunctions, type GenerateCoinMetadataParams } from './tools/types';
import { MessageHistoryStore } from './messageHistoryStore';
import { getStoredMasks } from './utils/chat/helpers';
import { useAppContext } from './context/useAppContext';
import { useWalletContext } from './context/useWalletContext';
import { WalletTypes } from './context/WalletContext';

let client: OpenAI | null = null;

const CHAT_MODEL = import.meta.env['VITE_CHAT_MODEL'] ?? 'gpt-4o-mini';
const IMAGE_GEN_MODEL = import.meta.env['VITE_IMAGE_GEN_MODEL'] ?? 'dall-e-3';

if (import.meta.env['MODE'] === 'development') {
  console.info({
    CHAT_MODEL,
    IMAGE_GEN_MODEL,
  });
}

export const App = () => {
  const { setErrorText, isReady, setIsReady, isRequesting, setIsRequesting } =
    useAppContext();

  const { walletAddress, walletType, walletChainId, connectWallet } =
    useWalletContext();

  console.log({ walletAddress, walletChainId, walletType });

  useEffect(() => {
    connectWallet({
      chainId: `0x${Number(2222).toString(16)}`,
      walletType: WalletTypes.METAMASK,
    });
  }, [connectWallet]);

  const [{ tools, systemPrompt, introText, cautionText }] = useState({
    introText: memeCoinGenIntroText,
    systemPrompt: memeCoinSystemPrompt,
    tools: memeCoinTools,
    cautionText: memeCoinGenWarningText,
  });

  // TODO: check healthcheck and set error if backend is not availiable
  useEffect(() => {
    try {
      client = new OpenAI({
        baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
        apiKey: getToken(),
        dangerouslyAllowBrowser: true,
      });
    } catch (err) {
      console.error(err);
      return;
    }

    setIsReady(true);
  }, [setIsReady]);

  const messages = useSyncExternalStore(
    messageHistoryStore.subscribe,
    messageHistoryStore.getSnapshot,
  );
  useEffect(() => {
    if (!messageHistoryStore.getSnapshot().length) {
      messageHistoryStore.addMessage({
        role: 'system' as const,
        content: systemPrompt,
      });
    }
    // we only want this to run once, so don't include [systemPrompt]
    // eslint-disable-next-line
  }, []);

  // update system prompt, when it changes
  useEffect(() => {
    const remainingMsgs = messageHistoryStore.getSnapshot().slice(1);
    messageHistoryStore.setMessages([
      { role: 'system', content: systemPrompt },
      ...remainingMsgs,
    ]);
  }, [systemPrompt]);

  // abort controller for cancelling openai request
  const controllerRef = useRef<AbortController | null>(null);

  const handleChatCompletion = useCallback(
    async (value: string) => {
      if (isRequesting) {
        return;
      }
      // should not happen
      if (!client) {
        console.error('client usage before ready');
        return;
      }

      toolCallStreamStore.clear();
      // Abort controller integrated with UI
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsRequesting(true);

      // Add the user message to the UI
      messageHistoryStore.addMessage({ role: 'user' as const, content: value });

      // Call chat completions and resolve all tool calls.
      //
      // This is recursive and completes when all tools calls have been made
      // and all follow ups have been completed.
      try {
        //  clear any existing error
        setErrorText('');

        await doChat(
          controller,
          client,
          messageHistoryStore,
          tools,
          progressStore,
          messageStore,
        );
      } catch (error) {
        let errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'An error occurred - please try again';

        //  Errors can be thrown when recursive call is cancelled
        if (errorMessage.includes('JSON')) {
          errorMessage = 'You clicked cancel - please try again';
        }

        setErrorText(errorMessage);
      } finally {
        setIsRequesting(false);
        controllerRef.current = null;
      }
    },
    [isRequesting, setErrorText, setIsRequesting, tools],
  );

  const handleCancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      toolCallStreamStore.clear();
    }
  }, []);

  const handleReset = useCallback(() => {
    handleCancel();
    messageHistoryStore.setMessages([
      { role: 'system' as const, content: systemPrompt },
    ]);
  }, [handleCancel, systemPrompt]);

  return (
    <>
      {isReady && (
        <ChatView
          introText={introText}
          cautionText={cautionText}
          messages={messages}
          onSubmit={handleChatCompletion}
          onReset={handleReset}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

async function doChat(
  controller: AbortController,
  client: OpenAI,
  messageHistoryStore: MessageHistoryStore,
  tools: ChatCompletionTool[],
  progressStore: TextStreamStore,
  messageStore: TextStreamStore,
) {
  progressStore.setText('Thinking');
  try {
    const stream = await client.chat.completions.create(
      {
        model: CHAT_MODEL,
        messages: messageHistoryStore.getSnapshot(),
        tools: tools,
        stream: true,
      },
      {
        signal: controller.signal,
      },
    );

    for await (const chunk of stream) {
      if (isContentChunk(chunk)) {
        if (progressStore.getSnapshot() !== '') {
          progressStore.setText('');
        }

        messageStore.appendText(chunk.choices[0].delta.content as string);
      } else if (isToolCallChunk(chunk)) {
        assembleToolCallsFromStream(chunk, toolCallStreamStore);
      }
    }

    // Push a message
    if (messageStore.getSnapshot() !== '') {
      messageHistoryStore.addMessage({
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      });

      messageStore.setText('');
    }

    if (toolCallStreamStore.getSnapShot().length > 0) {
      // do the tool calls
      await callTools(
        // controller,
        // client,
        // messageHistoryStore,
        toolCallStreamStore,
        // progressStore,
      );

      // inform the model of the tool call responses
      await doChat(
        controller,
        client,
        messageHistoryStore,
        tools,
        progressStore,
        messageStore,
      );
    }
  } catch (e) {
    console.error(`An error occurred: ${e} `);
    throw e;
  } finally {
    // Clear progress text if not cleared already
    if (progressStore.getSnapshot() !== '') {
      progressStore.setText('');
    }

    // Ensure content is published on abort
    if (messageStore.getSnapshot() !== '') {
      messageHistoryStore.addMessage({
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      });
      messageStore.setText('');
    }
  }
}

async function callTools(
  // controller: AbortController,
  // client: OpenAI,
  // messageHistoryStore: MessageHistoryStore,
  toolCallStreamStore: ToolCallStreamStore,
  // progressStore: TextStreamStore,
): Promise<void> {
  for (const toolCall of toolCallStreamStore.getSnapShot()) {
    const name = toolCall.function?.name;
    const { masksToValues } = getStoredMasks();

    let payload: {
      toolCall: Readonly<ToolCallStream>;
      masksToValues?: Record<string, string>;
    } = {
      toolCall,
    };

    //  send along the masksToValues only if entries exist
    if (Object.keys(masksToValues).length > 0) {
      payload = {
        ...payload,
        masksToValues,
      };
    }

    switch (name) {
      // todo (sah): handle tool calls based on their name
      default:
        console.warn(`unknown tool call: ${name}`);
        // throw new Error(`unknown tool call: ${name}`);
        break;
    }
  }
}
