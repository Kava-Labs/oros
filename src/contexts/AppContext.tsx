/* eslint-disable */
/**
 * TODO: Remove the eslint-disable and fix linting issues.
 */
import { createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { chat } from '../utils';
import { tools } from '../config';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageToolCall,
} from 'openai/resources/index';
import {
  getAccountBalances,
  transferAsset,
  getDisplayStakingApy,
  getDelegatedBalance,
} from '../tools/toolFunctions';
import { toast } from 'react-toastify';
import { generateCoinMetadata } from '../tools/toolFunctions';
import { deleteImages } from '../utils';
import { LocalStorage } from '../utils/storage';
import { ChatHistory } from '../utils/storage/types';
import {
  messageHistoryStore,
  MessageHistoryStore,
  StateStore,
  streamingMessageStore,
  StreamingMessageStore,
} from '../stores';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import {
  useSyncFromStorageOnReload,
  useSyncToStorage,
} from '../utils/storage/hooks';

interface AppContext {
  address: string;
  connectWallet: () => Promise<void>;
  submitUserChatMessage: (msg: string) => void;
  cancelStream: (() => void) | null;
  clearChatMessages: () => void;
  streamingMessageStore: StreamingMessageStore;
  messageHistoryStore: MessageHistoryStore;
  markDownCache: React.MutableRefObject<Map<string, string>>;
}

const mdCache = new Map<string, string>();
const initValues: AppContext = {
  address: '',
  connectWallet: async () => {
    throw new Error('Uninitialized');
  },
  submitUserChatMessage: () => {
    throw new Error('Uninitialized');
  },
  clearChatMessages: () => {
    throw new Error('Uninitialized');
  },
  cancelStream: null,
  streamingMessageStore: streamingMessageStore,
  messageHistoryStore: messageHistoryStore,
  markDownCache: { current: mdCache },
};

export const AppContext = createContext<AppContext>(initValues);

const storage = new LocalStorage<ChatHistory>('chat-messages', {
  messages: [],
});

export function AppContextProvider({
  children,
  messageHistoryStore,
  streamingMessageStore,
}: {
  children: ReactNode | ReactNode[];
  messageHistoryStore: StateStore<ChatCompletionMessageParam[]>;
  streamingMessageStore: StateStore<string>;
}) {
  const [address, setAddress] = useState('');
  const [cancelStream, setCancelStream] = useState<null | (() => void)>(null);

  const markDownCache = useRef<Map<string, string>>(mdCache);

  useSyncToStorage(storage);
  useSyncFromStorageOnReload(storage);

  const doChat = useCallback(() => {
    const cancelFN = chat({
      tools,
      model: 'gpt-4',
      messages: messageHistoryStore.getState(),
      onData: onChatStreamData,
      onDone: () => {
        onChatStreamDone();
        setCancelStream(null);
      },
      onToolCallRequest: onChatStreamToolCallRequest,
      onError: (err) => {
        const errorMessage = err.message ?? err;
        //  close the existing toast container before opening another
        toast.dismiss();
        toast.error(`A problem occurred: ${errorMessage}`);
      },
    });

    setCancelStream(() => {
      return () => {
        cancelFN();

        streamingMessageStore.setState('');
        const history = messageHistoryStore.getState();

        let i = history.length - 1;

        while (i > 1) {
          if (history[i].role === 'user') {
            break;
          }
          i--;
        }
        if (i) messageHistoryStore.setState(history.slice(0, i));

        setCancelStream(null);
      };
    });
  }, []);

  const submitUserChatMessage = useCallback((inputContent: string) => {
    if (!inputContent.length) return;
    messageHistoryStore.setState((prev) => [
      ...prev,
      {
        role: 'user',
        content: inputContent,
      },
    ]);

    // submit request with updated history
    doChat();
  }, []);

  // handlers
  const onChatStreamData = useCallback((chunk: string) => {
    streamingMessageStore.setState((prev) => prev + chunk);
  }, []);

  const onChatStreamDone = useCallback(() => {
    const content = streamingMessageStore.getState();
    if (content) {
      // add the new message we received from the model to history
      // clear streamingMessage since the request is done
      messageHistoryStore.setState((prev) => [
        ...prev,
        { role: 'assistant', content },
      ]);
      streamingMessageStore.setState('');
    }
  }, []);

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
              console.info('transferAsset');
              await doToolCall(tc, transferAsset);
              break;
            case 'getDisplayStakingApy':
              console.info('getDisplayStakingApy');
              await doToolCall(tc, getDisplayStakingApy);
              break;
            case 'getDelegatedBalance':
              console.info('getDelegatedBalance');
              await doToolCall(tc, getDelegatedBalance);
              break;

            case 'generateCoinMetadata':
              console.info('generateCoinMetadata');
              await doToolCall(tc, generateCoinMetadata);
              break;
            default:
              throw new Error(
                `unknown tool call function: ${tc.function?.name}`,
              );
          }
        }
      })();
    },
    [],
  );

  const doToolCall = useCallback(
    async (
      tc: ChatCompletionChunk.Choice.Delta.ToolCall,
      tcFunction: (arg: any) => Promise<any>,
    ) => {
      const args = tc.function?.arguments;

      messageHistoryStore.setState((prev) => [
        ...prev,
        {
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
        },
      ]);

      let results: any;

      try {
        results = await tcFunction(JSON.parse(args ?? ''));
      } catch (err) {
        results = err;
      }

      const commitToolCall =
        messageHistoryStore.getState().find((msg) => {
          return (
            msg.role === 'assistant' &&
            msg.content === null &&
            Array.isArray(msg.tool_calls) &&
            msg.tool_calls.find((toolCall) => toolCall.id === tc.id) !==
              undefined
          );
        }) !== undefined;

      if (commitToolCall) {
        messageHistoryStore.setState((prev) => [
          ...prev,
          {
            role: 'tool',
            content: JSON.stringify(results),
            tool_call_id: tc.id!,
          },
        ]);

        doChat();
      }
    },
    [],
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

      messageHistoryStore.setState((prev) => [
        ...prev,
        {
          role: 'system',
          content: `user's current wallet address: ${accounts[0]}`,
        },
      ]);
    }
  }, []);

  const clearChatMessages = useCallback(async () => {
    //  clear storage only when the user manually resets
    //  if we maintain parity between local storage and redux, we
    //  can inadvertently overwrite existing data in storage
    //  with an empty redux store before its repopulated
    await storage.reset();

    messageHistoryStore.setState([messageHistoryStore.getState()[0]]);

    markDownCache.current.clear();
    try {
      await deleteImages();
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        streamingMessageStore,
        messageHistoryStore,
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
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
};

export default AppContext;
