import { v4 as uuidv4 } from 'uuid';
import { TextStreamStore } from '../stores/textStreamStore';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ToolCallStreamStore } from '../stores/toolCallStreamStore';
import { ConversationHistory, ExecuteOperation } from './types';
import { OperationResult } from '../../features/blockchain/types/chain';
import OpenAI from 'openai';
import { ModelConfig } from '../types/models';
import {
  assembleToolCallsFromStream,
  isContentChunk,
  isToolCallChunk,
} from '../utils/streamUtils';
import { formatConversationTitle } from '../utils/conversation/helpers';
import {
  ChatCompletionChunk,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index';
import { getImage } from '../utils/idb/idb';
import {
  visionModelPrompt,
  visionModelPDFPrompt,
} from '../../features/reasoning/config/prompts/defaultPrompts';

export const newConversation = () => {
  return {
    conversationID: uuidv4(),
    messageStore: new TextStreamStore(),
    thinkingStore: new TextStreamStore(),
    progressStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
    messageHistoryStore: new MessageHistoryStore(),
    toolCallStreamStore: new ToolCallStreamStore(),
    isRequesting: false,
  };
};

const analyzeImage = async (
  client: OpenAI,
  msg: ChatCompletionUserMessageParam,
) => {
  if (Array.isArray(msg.content) && msg.content.length > 5) {
    // chunk those requests
    const textContent = msg.content.find((msg) => msg.type === 'text');
    if (!textContent) return;
    const requestMsgs: ChatCompletionUserMessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: textContent.text,
          },
        ],
      },
    ];
    for (const content of msg.content) {
      if (content.type === 'image_url') {
        if (requestMsgs[requestMsgs.length - 1].content.length >= 5) {
          requestMsgs.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: textContent.text,
              },
            ],
          });
        }

        (
          requestMsgs[requestMsgs.length - 1]
            .content as ChatCompletionContentPart[]
        ).push({ ...content });
      }
    }

    console.log(requestMsgs);
    const promises: Promise<string | undefined>[] = [];
    for (const request of requestMsgs) {
      promises.push(analyzeImage(client, request));
    }

    const results = await Promise.all(promises);
    console.log(results);
    return results.join('\n');
  } else {
    const data = await client.chat.completions.create({
      model: 'qwen2.5-vl-7b-instruct',
      messages: [msg],
    });

    // todo: needs better error handling
    if (!data.choices) {
      return JSON.stringify(data);
    }

    const imageDetails = data.choices[0].message.content;

    return imageDetails ? imageDetails : '';
  }
};

/**
 * Processes pending tool calls from the tool call stream, executes the corresponding operations,
 * and updates the message history with both the tool calls and their results.
 *
 * @param toolCallStreamStore - Store containing pending tool calls to be processed
 * @param messageHistoryStore - Store for maintaining the conversation message history
 * @param executeOperation - Function that executes the named operation with the provided arguments
 */
export async function callTools(
  toolCallStreamStore: ToolCallStreamStore,
  messageHistoryStore: MessageHistoryStore,
  executeOperation: ExecuteOperation,
): Promise<void> {
  for (const toolCall of toolCallStreamStore.getSnapShot()) {
    const name = toolCall.function?.name;

    if (name) {
      let content = '';
      try {
        const result = await executeOperation(
          name,
          toolCall.function.arguments,
        );
        content = JSON.stringify({
          status: 'ok',
          info: result,
        } as OperationResult);
      } catch (err) {
        console.error(err);
        content = JSON.stringify({
          status: 'failed',
          info: err instanceof Error ? err.message : err,
        } as OperationResult);
      }

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
    }
  }
}

/**
 * Manages a chat interaction with an AI model, handling streaming responses, tool calls,
 * and thinking/reasoning content.
 *
 * @param controller - AbortController to cancel the request if needed
 * @param client - OpenAI client instance for making API requests
 * @param messageHistoryStore - Store containing the conversation history
 * @param modelConfig - Configuration for the AI model including model ID and available tools
 * @param progressStore - Store for tracking and displaying progress status (e.g., "Thinking")
 * @param messageStore - Store for streaming the current message content
 * @param toolCallStreamStore - Store for tracking tool calls generated by the model
 * @param thinkingStore - Store for streaming the model's reasoning/thinking content
 * @param executeOperation - Function to execute tool operations when requested by the model
 * @param conversationID - Unique identifier for the current conversation
 *
 * The function handles different model behaviors, particularly the "deepseek-r1" model
 * which provides explicit thinking content within <think></think> tags.
 *
 * @returns Promise<void> - Resolves when the chat interaction completes or errors
 */
export async function doChat(
  controller: AbortController,
  client: OpenAI,
  messageHistoryStore: MessageHistoryStore,
  modelConfig: ModelConfig,
  progressStore: TextStreamStore,
  messageStore: TextStreamStore,
  toolCallStreamStore: ToolCallStreamStore,
  thinkingStore: TextStreamStore,
  executeOperation: ExecuteOperation,
  conversationID: string,
  isPDFUpload: boolean,
) {
  progressStore.setText('Thinking');
  const { id, tools } = modelConfig;

  const lastMsg =
    messageHistoryStore.getSnapshot()[
      messageHistoryStore.getSnapshot().length - 1
    ];

  let isFileUpload = false;
  const imageIDs: string[] = [];
  let userPromptForImage = '';

  const visionModelMsg: ChatCompletionMessageParam = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: isPDFUpload ? visionModelPDFPrompt : visionModelPrompt,
      },
    ],
  };

  // if the last user message is a file upload
  // take the id out of the image_url and replace it with the base64 imageURL from idb
  if (lastMsg && Array.isArray(lastMsg.content)) {
    for (const content of lastMsg.content) {
      if (content.type === 'image_url') {
        isFileUpload = true;
        imageIDs.push(content.image_url.url);
        const img = await getImage(content.image_url.url);
        (visionModelMsg.content as ChatCompletionContentPart[]).push({
          type: 'image_url',
          image_url: {
            url: img ? img.data : 'image not found!',
          },
        });
      }
      if (content.type === 'text') {
        userPromptForImage = content.text;
      }
    }
  }

  if (isFileUpload) {
    const imageDetails = await analyzeImage(client, visionModelMsg);

    messageHistoryStore.setMessages([
      ...messageHistoryStore.getSnapshot().slice(0, -1),
      {
        role: 'system',
        content: JSON.stringify(
          {
            context: 'User Image Uploaded and Analyzed by a vision model',
            imageIDs,
            imageDetails,
          },
          null,
          2,
        ),
      },
      {
        role: 'user',
        content: userPromptForImage,
      },
    ]);
  }

  try {
    // Create a copy of messages without reasoningContent to stream to the model
    // but don't modify the original messages in the store which we will render to the UI
    const messagesWithoutReasoningContent = messageHistoryStore
      .getSnapshot()
      .map((msg) => {
        const msgCopy = { ...msg };
        if ('reasoningContent' in msgCopy) {
          delete msgCopy.reasoningContent;
        }
        return msgCopy;
      });

    let finalChunk: ChatCompletionChunk | undefined;
    const stream = await client.chat.completions.create(
      {
        model: id,
        messages: messagesWithoutReasoningContent,
        tools: tools,
        stream: true,
      },
      {
        signal: controller.signal,
      },
    );

    let content = '';
    let thinkingEnd = -1;

    for await (const chunk of stream) {
      //  Get the usage info (in the final chunk)
      if (chunk.usage) {
        finalChunk = chunk;
      }

      if (progressStore.getSnapshot() !== '') {
        progressStore.setText('');
      }

      if (isContentChunk(chunk)) {
        content += chunk['choices'][0]['delta']['content'];
        // todo: chance to clean up into a helper similar to assembleToolCallFromStream
        switch (modelConfig.id) {
          case 'deepseek-r1': {
            const openTag = '<think>';
            const closeTag = '</think>';

            if (thinkingEnd === -1) {
              thinkingEnd = content.indexOf(closeTag);
              // stream the thoughts part to the thinking store
              if (content.length >= openTag.length) {
                thinkingStore.setText(
                  content.slice(
                    openTag.length,
                    thinkingEnd === -1 ? content.length : thinkingEnd,
                  ),
                );
              }
            }

            if (thinkingEnd !== -1) {
              // stream the response part to the message store
              messageStore.setText(
                content.slice(thinkingEnd + closeTag.length),
              );
            }
            break;
          }

          default: {
            messageStore.setText(content);
            break;
          }
        }
      } else if (isToolCallChunk(chunk)) {
        assembleToolCallsFromStream(chunk, toolCallStreamStore);
      }
    }

    // Push a message
    if (messageStore.getSnapshot() !== '') {
      const msg = {
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      };

      if (thinkingStore.getSnapshot() !== '') {
        // @ts-expect-error setting reasoningContent
        msg.reasoningContent = thinkingStore.getSnapshot();
        thinkingStore.setText('');
      }

      messageHistoryStore.addMessage(msg);

      messageStore.setText('');
    }

    if (toolCallStreamStore.getSnapShot().length > 0) {
      // do the tool calls
      await callTools(
        toolCallStreamStore,
        messageHistoryStore,
        executeOperation,
      );

      // inform the model of the tool call responses
      await doChat(
        controller,
        client,
        messageHistoryStore,
        modelConfig,
        progressStore,
        messageStore,
        toolCallStreamStore,
        thinkingStore,
        executeOperation,
        conversationID,
        isPDFUpload,
      );
    }
    syncWithLocalStorage(
      conversationID,
      modelConfig,
      messageHistoryStore,
      client,
      finalChunk,
    );
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

/**
 * Synchronizes the current conversation state with local storage, managing conversation
 * history, tracking token usage, and generating conversation titles.
 *
 * @param conversationID - Unique identifier for the conversation to be saved
 * @param modelConfig - Configuration for the AI model including ID and context length
 * @param messageHistoryStore - Store containing the current conversation messages
 * @param client - OpenAI client instance used for generating conversation titles
 * @param finalChunk - Optional completion chunk containing token usage information (used by deepseek models)
 *
 * @returns Promise<void> - Resolves when synchronization is complete
 */
export async function syncWithLocalStorage(
  conversationID: string,
  modelConfig: ModelConfig,
  messageHistoryStore: MessageHistoryStore,
  client: OpenAI,
  finalChunk?: ChatCompletionChunk, // Used by deepseek for token tracking
) {
  const { id, contextLength } = modelConfig;
  const messages = messageHistoryStore.getSnapshot();
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (!firstUserMessage) return;

  const { content } = firstUserMessage;

  const allConversations: Record<string, ConversationHistory> = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const existingConversation = allConversations[conversationID];

  // Initialize tokensRemaining from existing conversation or default to full context length
  let tokensRemaining = existingConversation?.tokensRemaining ?? contextLength;

  //  Deepseek compares the current message to the remaining context
  //  GPT compares the entire conversation thread to the max context
  const contextToProcess =
    modelConfig.id === 'deepseek-r1' ? tokensRemaining : contextLength;

  const metrics = await modelConfig.contextLimitMonitor(
    messages,
    contextToProcess,
    finalChunk,
  );
  tokensRemaining = metrics.tokensRemaining;

  const history: ConversationHistory = {
    id: conversationID,
    model: existingConversation ? existingConversation.model : id,
    title: existingConversation ? existingConversation.title : 'New Chat', // initial & fallback value
    conversation: messages,
    lastSaved: new Date().valueOf(),
    tokensRemaining,
  };

  if (existingConversation && existingConversation.conversation.length <= 4) {
    try {
      const data = await client.chat.completions.create({
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'your task is to generate a title for a conversation using 3 to 4 words',
          },
          {
            role: 'user',
            content: `Please generate a title for this conversation (max 4 words):
                      ${messages.map((msg) => {
                        // only keep user/assistant messages
                        if (msg.role !== 'user' && msg.role !== 'assistant')
                          return;

                        return `Role: ${msg.role} 
                                      ${msg.content}
                        `;
                      })}
                      `,
          },
        ],
        model: 'gpt-4o-mini',
      });

      // Apply truncation only when we get the AI-generated title
      const generatedTitle =
        data.choices[0].message.content ?? (content as string);
      history.title = formatConversationTitle(generatedTitle, 34);
    } catch (err) {
      history.title = content as string;
      console.error(err);
    }
  }

  allConversations[conversationID] = history;
  localStorage.setItem('conversations', JSON.stringify(allConversations));
}
