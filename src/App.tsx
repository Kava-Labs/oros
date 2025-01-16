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
import {
  memeCoinSystemPrompt,
  memeCoinGenIntroText,
} from './config/prompts/systemPrompt';
import { memeCoinTools } from './config/tools';
import { imagedb } from './imagedb';
import { v4 as uuidv4 } from 'uuid';
import { ToolCallStream, ToolCallStreamStore } from './toolCallStreamStore';
import { ToolFunctions, type GenerateCoinMetadataParams } from './tools/types';
import type { AnyIFrameMessage } from './types';
import { MessageHistoryStore } from './messageHistoryStore';
import { getStoredMasks } from './utils/chat/helpers';

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
  // Do not load UI/UX until openAI client is ready
  const [isReady, setIsReady] = useState(false);
  const [errorText, setErrorText] = useState('');

  const [{ tools, systemPrompt, introText }, setConfig] = useState({
    introText: memeCoinGenIntroText,
    systemPrompt: memeCoinSystemPrompt,
    tools: memeCoinTools,
  });

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
          case 'WALLET_CONNECTION/V1': {
            console.info('WALLET_CONNECTION/V1', event.data);
            setWallet({
              address: event.data.payload.address,
              chainID: event.data.payload.chainID,
            });
            break;
          }
          case 'SET_SYSTEM_PROMPT/V1': {
            console.info('SET_SYSTEM_PROMPT/V1', event.data);
            const systemPrompt = event.data.payload.systemPrompt;
            setConfig((prev) => ({ ...prev, systemPrompt }));
            break;
          }
          case 'SET_TOOLS/V1': {
            console.info('SET_TOOLS/V1', event.data);
            const tools = event.data.payload.tools;
            setConfig((prev) => ({ ...prev, tools }));
            break;
          }
          case `SET_INTRO_TEXT/V1`: {
            console.info('SET_INTRO_TEXT/V1', event.data);
            const introText = event.data.payload.introText;
            setConfig((prev) => ({ ...prev, introText }));
            break;
          }

          case 'SET_PROGRESS_TEXT/V1': {
            console.info('SET_PROGRESS_TEXT/V1', event.data);
            progressStore.setText(event.data.payload.text);
            break;
          }

          case `TOOL_CALL_RESPONSE/V1`: {
            console.info(`TOOL_CALL_RESPONSE/V1`, event.data);
            const toolCall = event.data.payload.toolCall;
            const content = event.data.payload.content;

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
              tool_call_id: toolCall.id,
              content,
            });

            controllerRef.current = new AbortController();
            setIsRequesting(true);
            setErrorText('');
            // once the tool call response is received from the dapp
            // call doChat to inform the model
            doChat(
              controllerRef.current,
              client!,
              messageHistoryStore,
              tools,
              progressStore,
              messageStore,
            )
              .catch((error) => {
                let errorMessage =
                  typeof error === 'object' &&
                  error !== null &&
                  'message' in error
                    ? (error as { message: string }).message
                    : 'An error occurred - please try again';

                //  Errors can be thrown when recursive call is cancelled
                if (errorMessage.includes('JSON')) {
                  errorMessage = 'You clicked cancel - please try again';
                }

                setErrorText(errorMessage);
              })
              .finally(() => {
                controllerRef.current = null;
                setIsRequesting(false);
              });

            break;
          }
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
  }, [tools]);

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
    [isRequesting, tools],
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
      const hasMemeCoinGenToolCall =
        toolCallStreamStore
          .getSnapShot()
          .find(
            (tc) => tc.function.name === ToolFunctions.GENERATE_COIN_METADATA,
          ) !== undefined;

      await callTools(
        controller,
        client,
        messageHistoryStore,
        toolCallStreamStore,
        progressStore,
      );

      // only call doChat for meme coin generation
      // dapps will send the TOOL_CALL_RESPONSE/V1 event
      // which is when we can call doChat
      // calling doChat here for anything other than a memecoin gen will result
      // in an infinite loop of requests
      if (hasMemeCoinGenToolCall) {
        await doChat(
          controller,
          client,
          messageHistoryStore,
          tools,
          progressStore,
          messageStore,
        );
      }
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
  const isInIframe = window !== window.parent;
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

    if (isInIframe) {
      window.parent.postMessage(
        {
          type: 'TOOL_CALL',
          payload,
        },
        '*',
      );
    }

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
      default:
        console.warn(`unknown tool call: ${name}`);
        // throw new Error(`unknown tool call: ${name}`);
        break;
    }
  }
}
