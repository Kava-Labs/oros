import { useRef, useState, useEffect } from 'react';
import { ChatView } from './ChatView';
import { getToken } from './utils/token/token';
import OpenAI from 'openai';
import { messageStore, progressStore } from './store';
import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from 'openai/resources/index';
import {
  isContentChunk,
  isToolCallChunk,
  assembleToolCallsFromStream,
} from './utils/chat/chat';
import { TextStreamStore } from './textStreamStore';
import { systemPrompt } from './config/systemPrompt';
import { tools } from './config/tools';
import { imagedb } from './imagedb';
import { v4 as uuidv4 } from 'uuid';

let client: OpenAI | null = null;

export const App = () => {
  // Do not load UI/UX until openAI client is ready
  const [isReady, setIsReady] = useState(false);
  const [errorText, setErrorText] = useState('');

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

  // store entire thread of messages in state
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    { role: 'system' as const, content: systemPrompt },
  ]);
  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  const [isRequesting, setIsRequesting] = useState(false);

  // abort controller for cancelling openai request
  const controllerRef = useRef<AbortController | null>(null);

  const handleChatCompletion = async (value: string) => {
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
    const newMessages = [
      ...messages,
      { role: 'user' as const, content: value },
    ];
    setMessages(newMessages);

    // Ensure local messages always matches the state messages
    const publishMessage = (
      messages: ChatCompletionMessageParam[],
      message: ChatCompletionMessageParam,
    ) => {
      messages.push(message);
      setMessages([...messages]);
    };

    // Call chat completions and resolve all tool calls.
    //
    // This is recursive and completes when all tools calls have been made
    // and all follow ups have been completed.
    try {
      setErrorText('');

      await doChat(
        controller,
        client,
        newMessages,
        tools,
        progressStore,
        messageStore,
        publishMessage,
      );
    } catch (error) {
      let errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An error occurred - please try again';

      if (errorMessage.startsWith('Unterminated string in JSON at position')) {
        errorMessage = 'You clicked cancel - please try again';
      }

      setErrorText(errorMessage);
    } finally {
      setIsRequesting(false);
      controllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  };

  const handleReset = () => {
    handleCancel();
    setMessages([{ role: 'system' as const, content: systemPrompt }]);
  };

  return (
    <>
      {isReady && (
        <ChatView
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
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
  progressStore: TextStreamStore,
  messageStore: TextStreamStore,
  publishMessage: (
    messages: ChatCompletionMessageParam[],
    message: ChatCompletionMessageParam,
  ) => void,
) {
  progressStore.setText('Thinking');
  //  clear any existing error
  try {
    const toolCallsState: ChatCompletionChunk.Choice.Delta.ToolCall[] = [];

    const stream = await client.chat.completions.create(
      {
        model: 'gpt-4',
        messages: messages,
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
        assembleToolCallsFromStream(chunk, toolCallsState);
      }
    }

    // Push a message
    if (messageStore.getSnapshot() !== '') {
      publishMessage(messages, {
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      });
      messageStore.setText('');
    }

    if (toolCallsState.length > 0) {
      await callTools(
        controller,
        client,
        messages,
        toolCallsState,
        progressStore,
        publishMessage,
      );

      await doChat(
        controller,
        client,
        messages,
        tools,
        progressStore,
        messageStore,
        publishMessage,
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
      publishMessage(messages, {
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
  messages: ChatCompletionMessageParam[],
  toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[],
  progressStore: TextStreamStore,
  publishMessage: (
    messages: ChatCompletionMessageParam[],
    message: ChatCompletionMessageParam,
  ) => void,
): Promise<void> {
  for (const toolCall of toolCalls) {
    const name = toolCall.function?.name;
    switch (name) {
      case 'generateCoinMetadata': {
        const args = JSON.parse(toolCall.function?.arguments || '');
        const response = client.images.generate(
          {
            model: 'dall-e-3',
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

        publishMessage(messages, {
          role: 'assistant' as const,
          function_call: null,
          content: null,
          tool_calls: [
            {
              id: toolCall.id,
              function: toolCall.function,
              type: 'function',
            } as ChatCompletionMessageToolCall,
          ],
        });
        publishMessage(messages, {
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
        throw new Error(`unknown tool call: ${name}`);
    }
  }
}
