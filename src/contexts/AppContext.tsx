import {
  createContext,
  useContext,
} from "react";
import type { ReactNode } from "react";
import { useCallback, useState } from 'react';
import { batch } from 'react-redux';
import {
  appStore as _appStore,
  messageHistoryAddMessage,
  messageHistoryDropLast,
  selectMessageHistory,
  selectStreamingMessage,
  streamingMessageClear,
  streamingMessageConcat
} from '../stores';
import { chat } from '../utils';
import { tools } from '../config';
import type { ChatCompletionChunk, ChatCompletionMessageToolCall } from 'openai/resources/index';
import { getAccountBalances, sendKava, transactionToolCallFunctionNames, transferERC20 } from '../tools/toolFunctions';

interface AppContext {
  address: string;
  connectWallet: () => Promise<void>;
  submitChatMessage: (msg: string) => void;
  cancelStream: (() => void) | null;
}

const initValues = {
  address: "",
  connectWallet: async () => {
    throw new Error("Uninitialized");
  },
  submitChatMessage: () => {
    throw new Error('Uninitialized');
  },
  cancelStream: null,
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

  const doChat = useCallback(() => {
    const cancelFN = chat({
      tools,
      model: 'gpt-4',
      messages: selectMessageHistory(store.getState()),
      onData: onChatStreamData,
      onDone: () => { onChatStreamDone(); setCancelStream(null); },
      onToolCallRequest: onChatStreamToolCallRequest,
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

  const submitChatMessage = useCallback((inputContent: string) => {
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
          case "sendKava":
            console.info("sendKava");
            await doToolCall(tc, sendKava);
            break;
          case "transferERC20":
            console.info("transferERC20");
            await doToolCall(tc, transferERC20);
            break;
          default:
            throw new Error(`unknown tool call function: ${tc.function?.name}`);
        }
      }
    })()

  }, []);


  const doToolCall = useCallback(async (tc: ChatCompletionChunk.Choice.Delta.ToolCall, tcFunction: (arg: any) => Promise<any>) => {
    const args = tc.function?.arguments as any;
    store.dispatch(messageHistoryAddMessage({
      role: 'assistant',
      function_call: null,
      content: null,
      tool_calls: [{ id: tc.id, function: tc.function, type: "function" } as ChatCompletionMessageToolCall]
    }));

    let results: any;

    let tcError = false;
    try {
      results = await tcFunction(JSON.parse(args));
    } catch (err) {
      tcError = true;
      results = err;
    }

    if (!tcError && transactionToolCallFunctionNames.includes(tc.function?.name as string)) {
      try {
        results = await window.ethereum.request(results);
      } catch (err) {
        console.error(err);
        results = err;
      }
    }

    store.dispatch(messageHistoryAddMessage({
      role: "tool",
      content: JSON.stringify(results),
      // @ts-ignore
      tool_call_id: tc.id,
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


  return (
    <AppContext.Provider
      value={{
        submitChatMessage,
        cancelStream,
        address,
        connectWallet,
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
