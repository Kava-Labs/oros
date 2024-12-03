import {
  createContext,
  useContext,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useCallback, useState } from 'react';
import { batch } from 'react-redux';
import {
  appStore as _appStore,
  messageHistoryAddMessage,
  messageHistoryClear,
  messageHistoryDropLast,
  selectMessageHistory,
  selectStreamingMessage,
  streamingMessageClear,
  streamingMessageConcat
} from '../stores';
import { chat } from '../utils';
import { tools } from '../config';
import type { ChatCompletionChunk, ChatCompletionMessageToolCall } from 'openai/resources/index';
import { getAccountBalances, transferAsset } from '../tools/toolFunctions';

interface AppContext {
  address: string;
  connectWallet: () => Promise<void>;
  submitUserChatMessage: (msg: string) => void;
  cancelStream: (() => void) | null;
  clearChatMessages: () => void;
  markDownCache: React.MutableRefObject<Map<string, string>>;
}

const mdCache = new Map<string, string>();
const initValues = {
  address: "",
  connectWallet: async () => {
    throw new Error("Uninitialized");
  },
  submitUserChatMessage: () => {
    throw new Error('Uninitialized');
  },
  clearChatMessages: () => {
    throw new Error('Uninitialized');
  },
  cancelStream: null,
  markDownCache: { current: mdCache }
};

export const AppContext = createContext<AppContext>(initValues);

export function AppContextProvider({
  children,
  store = _appStore,
}: {
  children: ReactNode | ReactNode[];
  store?: typeof _appStore,
}) {

  const [address, setAddress] = useState("");
  const [cancelStream, setCancelStream] = useState<null | (() => void)>(null);

  const markDownCache = useRef<Map<string, string>>(mdCache);


  const doChat = useCallback(() => {
    const cancelFN = chat({
      tools,
      model: 'gpt-4',
      messages: selectMessageHistory(store.getState()),
      onData: onChatStreamData,
      onDone: () => { onChatStreamDone(); setCancelStream(null); },
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
        })

        setCancelStream(null);
      }
    });

  }, [store]);

  const submitUserChatMessage = useCallback((inputContent: string) => {
    if (!inputContent.length) return;
    // add to history 
    store.dispatch(messageHistoryAddMessage({ role: 'user', content: inputContent }));
    // submit request with updated history 
    doChat();
  }, [store]);


  // handlers
  const onChatStreamData = useCallback((chunk: string) => {
    store.dispatch(streamingMessageConcat(chunk));
  }, [store]);

  const onChatStreamDone = useCallback(() => {
    const content = selectStreamingMessage(store.getState());
    if (content) {
      batch(() => {
        // add the new message we received from the model to history
        // clear streamingMessage since the request is done
        store.dispatch(messageHistoryAddMessage({ role: 'assistant', content: content }));
        store.dispatch(streamingMessageClear());
      })
    }
  }, [store]);

  const onChatStreamToolCallRequest = useCallback((toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[]) => {
    (async () => {
      for (const tc of toolCalls) {
        const name = tc.function?.name;
        switch (name) {
          case "getAccountBalances":
            console.info("getAccountBalances");
            await doToolCall(tc, getAccountBalances);
            break;
          case "transferAsset":
            console.info("sendKava");
            await doToolCall(tc, transferAsset);
            break;

          default:
            throw new Error(`unknown tool call function: ${tc.function?.name}`);
        }
      }
    })()

  }, []);


  const doToolCall = useCallback(async (tc: ChatCompletionChunk.Choice.Delta.ToolCall, tcFunction: (arg: any) => Promise<any>) => {
    const args = tc.function?.arguments;
    store.dispatch(messageHistoryAddMessage({
      role: 'assistant',
      function_call: null,
      content: null,
      tool_calls: [{ id: tc.id, function: tc.function, type: "function" } as ChatCompletionMessageToolCall]
    }));

    let results: any;

    try {
      results = await tcFunction(JSON.parse(args ?? ""));
    } catch (err) {
      results = err;
    }

    store.dispatch(messageHistoryAddMessage({
      role: "tool",
      content: JSON.stringify(results),
      tool_call_id: tc.id!,
    }));

    doChat();
  }, [store])



  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }


    const accounts: string[] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (accounts && accounts[0]) {
      setAddress(() => accounts[0]);
      store.dispatch(messageHistoryAddMessage({ role: 'system', content: `user's current wallet address: ${accounts[0]}` }));
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
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};

export default AppContext;
