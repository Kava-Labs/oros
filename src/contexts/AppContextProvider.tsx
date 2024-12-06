import { useCallback, useRef, useState, ReactNode } from 'react';
import { batch } from 'react-redux';
import {
  appStore as _appStore,
  messageHistoryAddMessage,
  messageHistoryClear,
  messageHistoryDropLast,
  selectMessageHistory,
  selectMessageStore,
  selectStreamingMessage,
  streamingMessageClear,
  streamingMessageConcat,
} from '../stores';
import { mdCache } from './AppContext';
import { chat } from '../utils';
import { tools } from '../config';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageToolCall,
} from 'openai/resources/index';
import { getAccountBalances, transferAsset } from '../tools/toolFunctions';
import AppContext from './AppContext';

export const AppContextProvider = ({
  children,
  store = _appStore,
}: {
  children: ReactNode | ReactNode[];
  store?: typeof _appStore;
}) => {
  const [address, setAddress] = useState('');
  const [cancelStream, setCancelStream] = useState<null | (() => void)>(null);

  const markDownCache = useRef<Map<string, string>>(mdCache);

  // handlers
  const doToolCall = useCallback(
    async (
      tc: ChatCompletionChunk.Choice.Delta.ToolCall,
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      tcFunction: (arg: any) => Promise<any>,
    ) => {
      const args = tc.function?.arguments;
      store.dispatch(
        messageHistoryAddMessage({
          role: 'assistant',
          function_call: null,
          content: null,
          tool_calls: [
            {
              id: tc.id,
              function: tc.function,
              type: 'function',
            } as ChatCompletionMessageToolCall,
          ],
        }),
      );

      /* eslint-disable  @typescript-eslint/no-explicit-any */
      let results: any;

      try {
        results = await tcFunction(JSON.parse(args ?? ''));
      } catch (err) {
        results = err;
      }

      const commitToolCall =
        selectMessageStore(store.getState()).history.find((msg) => {
          return (
            msg.role === 'assistant' &&
            msg.content === null &&
            Array.isArray(msg.tool_calls) &&
            msg.tool_calls.find((toolCall) => toolCall.id === tc.id) !==
              undefined
          );
        }) !== undefined;

      if (commitToolCall) {
        store.dispatch(
          messageHistoryAddMessage({
            role: 'tool',
            content: JSON.stringify(results),
            tool_call_id: tc.id!,
          }),
        );

        doChat();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store],
  );

  const onChatStreamData = useCallback(
    (chunk: string) => {
      store.dispatch(streamingMessageConcat(chunk));
    },
    [store],
  );

  const onChatStreamDone = useCallback(() => {
    const content = selectStreamingMessage(store.getState());
    if (content) {
      batch(() => {
        // add the new message we received from the model to history
        // clear streamingMessage since the request is done
        store.dispatch(
          messageHistoryAddMessage({ role: 'assistant', content: content }),
        );
        store.dispatch(streamingMessageClear());
      });
    }
  }, [store]);

  const onChatStreamToolCallRequest = useCallback(
    (toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[]) => {
      (async () => {
        for (const tc of toolCalls) {
          const name = tc.function?.name;
          switch (name) {
            case 'getAccountBalances':
              console.info('getAccountBalances');
              await doToolCall(tc, getAccountBalances);
              break;
            case 'transferAsset':
              console.info('sendKava');
              await doToolCall(tc, transferAsset);
              break;

            default:
              throw new Error(
                `unknown tool call function: ${tc.function?.name}`,
              );
          }
        }
      })();
    },
    [doToolCall],
  );

  const doChat = useCallback(() => {
    const cancelFN = chat({
      tools,
      model: 'gpt-4',
      messages: selectMessageHistory(store.getState()),
      onData: onChatStreamData,
      onDone: () => {
        onChatStreamDone();
        setCancelStream(null);
      },
      onToolCallRequest: onChatStreamToolCallRequest,
      onError: (err) => {
        console.error(err);
        alert('error encountered please check console'); // todo(sah): improved error handling
      },
    });

    setCancelStream(() => {
      return () => {
        cancelFN();

        batch(() => {
          store.dispatch(streamingMessageClear());
          store.dispatch(messageHistoryDropLast());
        });

        setCancelStream(null);
      };
    });
  }, [store, onChatStreamData, onChatStreamDone, onChatStreamToolCallRequest]);

  const submitUserChatMessage = useCallback(
    (inputContent: string) => {
      if (!inputContent.length) return;
      // add to history
      store.dispatch(
        messageHistoryAddMessage({ role: 'user', content: inputContent }),
      );
      // submit request with updated history
      doChat();
    },
    [store, doChat],
  );

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const accounts: string[] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    if (accounts && accounts[0]) {
      setAddress(() => accounts[0]);
      store.dispatch(
        messageHistoryAddMessage({
          role: 'system',
          content: `user's current wallet address: ${accounts[0]}`,
        }),
      );
    }
  }, [store]);

  const clearChatMessages = useCallback(() => {
    store.dispatch(messageHistoryClear());
    markDownCache.current.clear();
  }, [store]);

  return (
    <AppContext.Provider
      value={{
        submitUserChatMessage,
        cancelStream,
        connectWallet,
        clearChatMessages,
        address,
        markDownCache,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
