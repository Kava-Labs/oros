import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { ChatView } from './ChatView';
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
import { tools } from './config/tools';
import { imagedb } from './imagedb';
import { v4 as uuidv4 } from 'uuid';
import { ToolCallStreamStore } from './toolCallStreamStore';
import { ToolFunctions, type GenerateCoinMetadataParams } from './tools/types';
import type { AnyIFrameMessage } from './types';
import { MessageHistoryStore } from './messageHistoryStore';
import { navigationSystemPrompt } from './config/navigationSystemPrompt';
import { navigateToPage } from './config/toolFunctions';
import { memecoinSystemPrompt } from './config';

let client: OpenAI | null = null;

const CHAT_MODEL = import.meta.env['VITE_CHAT_MODEL'] ?? 'gpt-4o-mini';
const IMAGE_GEN_MODEL = import.meta.env['VITE_IMAGE_GEN_MODEL'] ?? 'dall-e-3';
const SYSTEM_PROMPT =
  import.meta.env['VITE_KAVA_WEBAPP'] === 'true'
    ? navigationSystemPrompt
    : memecoinSystemPrompt;

if (import.meta.env['MODE'] === 'development') {
  console.info({
    CHAT_MODEL,
    IMAGE_GEN_MODEL,
  });
}

export const App = () => {
  // Do not load UI/UX until openAI client is ready
  const [isReady, setIsReady] = useState(false);
  const [errorText, setErrorText] = useState('');

  const [wallet, setWallet] = useState({
    address: '',
    chainID: '',
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
  }, []);

  useEffect(() => {
    const parentMessageHandler = (event: MessageEvent<AnyIFrameMessage>) => {
      // Handle the message
      if (event.data && event.data.namespace === 'KAVA_CHAT') {
        console.info('event received from parent: ', event);
        switch (event.data.type) {
          case 'WALLET_CONNECTION/V1':
            console.info('WALLET_CONNECTION', event.data);
            setWallet({
              address: event.data.payload.address,
              chainID: event.data.payload.chainID,
            });
            break;
          default:
            console.warn('unknown event type', event.type);
            break;
        }
      }
    };

    // register parentMessageHandler when inside iFrame
    if (window.top !== window.self) {
      window.addEventListener('message', parentMessageHandler);
    }
    return () => {
      if (window.top !== window.self) {
        window.removeEventListener('message', parentMessageHandler);
      }
    };
  }, []);

  const messages = useSyncExternalStore(
    messageHistoryStore.subscribe,
    messageHistoryStore.getSnapshot,
  );

  useEffect(() => {
    if (!messageHistoryStore.getSnapshot().length) {
      messageHistoryStore.addMessage({
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      });
    }
  }, []);

  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  const [isRequesting, setIsRequesting] = useState(false);

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
    [isRequesting, messages],
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
      { role: 'system' as const, content: SYSTEM_PROMPT },
    ]);
  }, [handleCancel]);

  return (
    <>
      {isReady && (
        <ChatView
          address={wallet.address}
          chainID={wallet.chainID}
          messages={messages}
          onSubmit={handleChatCompletion}
          onReset={handleReset}
          onCancel={handleCancel}
          isRequesting={isRequesting}
          errorText={errorText}
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
      await callTools(
        controller,
        client,
        messageHistoryStore,
        toolCallStreamStore,
        progressStore,
      );

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
  controller: AbortController,
  client: OpenAI,
  messageHistoryStore: MessageHistoryStore,
  toolCallStreamStore: ToolCallStreamStore,
  progressStore: TextStreamStore,
): Promise<void> {
  for (const toolCall of toolCallStreamStore.getSnapShot()) {
    const name = toolCall.function?.name;
    switch (name) {
      case ToolFunctions.GENERATE_COIN_METADATA: {
        const args = toolCall.function.arguments as GenerateCoinMetadataParams;
        const response = client.images.generate(
          {
            model: IMAGE_GEN_MODEL,
            prompt: args['prompt'],
            quality: 'hd',
            response_format: 'b64_json',
          },
          {
            signal: controller.signal,
          },
        );
        const imageId = uuidv4();
        imagedb.set(
          imageId,
          (async () => {
            const image = await response;

            return `data:image/png;base64,${image.data[0].b64_json!}`;
          })(),
        );

        messageHistoryStore.addMessage({
          role: 'assistant' as const,
          function_call: null,
          content: null,
          tool_calls: [
            toolCallStreamStore.toChatCompletionMessageToolCall(toolCall),
          ],
        });

        toolCallStreamStore.deleteToolCallById(toolCall.id);

        messageHistoryStore.addMessage({
          role: 'tool' as const,
          tool_call_id: toolCall.id!,
          content: JSON.stringify({
            id: imageId,
            name: args['name'],
            about: args['about'],
            symbol: args['symbol'],
          }),
        });

        progressStore.setText('Generating Image');
        await imagedb.get(imageId);

        break;
      }
      case ToolFunctions.NAVIGATE_TO_PAGE: {
        try {
          const args = toolCall.function.arguments as Record<string, string>;

          messageHistoryStore.addMessage({
            role: 'assistant' as const,
            function_call: null,
            content: null,
            tool_calls: [
              toolCallStreamStore.toChatCompletionMessageToolCall(toolCall),
            ],
          });

          messageHistoryStore.addMessage({
            role: 'tool' as const,
            tool_call_id: toolCall.id!,
            content: JSON.stringify({
              url: args.url,
            }),
          });

          toolCallStreamStore.deleteToolCallById(toolCall.id);

          await navigateToPage(args.url);
        } catch (error) {
          console.error('Navigation failed:', error);
        }
        break;
      }
      default:
        throw new Error(`unknown tool call: ${name}`);
    }
  }
}
