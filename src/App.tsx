import { DeepChat as DeepChatCore } from "deep-chat";
import { useCallback, useState } from "react";
import kavaLogo from "./assets/kavaLogo.svg";
import { useAppContext } from "./contexts/AppContext";
import { DeepChat } from 'deep-chat-react';
import { DemoBanner } from "./components/DemoBanner";
import styles from "./style.module.css";
import { getToken } from './utils';


const connectionConfig = {
  url: "http://localhost:5555/openai/v1/chat/completions",
  stream: true,
  additionalBodyProps: { model: "gpt-4o", chaos: false },
  headers: {
    "Authorization": `Bearer ${getToken()}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any; // TODO: define appropriate type for this

// Info to get a reference for the component:
// https://github.com/OvidijusParsiunas/deep-chat/issues/59#issuecomment-1839483469

// Info to add types to a component reference:
// https://github.com/OvidijusParsiunas/deep-chat/issues/59#issuecomment-1839487740


const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;

function Header() {
  console.log(kavaLogo);
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src={kavaLogo} alt="Logo" height={35} />
      </div>
    </header>
  );
}

type DisplayControlsProps = {
  getMessages: () => Message[];
  clearMessages: () => void;
};

function DeployControls({ getMessages, clearMessages }: DisplayControlsProps) {
  return (
    <div className={styles.deployControls}>
      <ShareButton getMessages={getMessages} />
      <ConnectWallet />
      <button className={styles.inactive}>Deploy</button>
      <ResetChatButton clearMessages={clearMessages} />
    </div>
  );
}

function ConnectWallet() {
  const { connectWallet } = useAppContext();
  return (
    <button
      className={styles.active}
      onClick={(e) => {
        e.preventDefault();
        connectWallet();
      }}
    >
      Connect Wallet
    </button>
  );
}

function ShareButton({ getMessages }: { getMessages: () => Message[] }) {
  const [loading, setLoading] = useState(false);

  const tweetIntent = (tweetText: string) => {
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // For iOS, use window.location.href to open the URL in the same tab. It doesn't support opening new tabs (when calling api first).
      window.location.href = twitterIntentUrl;
    } else {
      // For other platforms, open in a new window/tab
      window.open(twitterIntentUrl, "_blank");
    }
  };

  const shareButtonCallback = async () => {
    setLoading(true);

    try {
      const msgs = getMessages();
      if (msgs.length === 0) {
        throw new Error("No messages to compose tweet from");
      }

      const response = await fetch("/api/tweets/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: msgs }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      tweetIntent(data.tweet);

      console.log("Tweet composed successfully:", data);
    } catch (error) {
      console.error("Error composing tweet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={styles.active} onClick={shareButtonCallback}>
      {loading ? "Loading..." : "Share"}
    </button>
  );
}

function ResetChatButton({ clearMessages }: { clearMessages: () => void }) {
  return (
    <button className={styles.active} onClick={clearMessages}>
      Reset Chat
    </button>
  );
}


export function App() {
  const { deepChatRef } = useAppContext();

  const getChatMessages = () => {
    if (deepChatRef.current) {
      // probably a better way to setup types
      const deepChatElement = deepChatRef.current.children[0] as DeepChatCore;
      return deepChatElement.getMessages();
    } else {
      return [];
    }
  };

  const submitChatMessage = useCallback(
    (text: string, delay = 1500) => {
      if (deepChatRef.current) {
        const deepChatElement = deepChatRef.current.children[0] as DeepChatCore;
        // for some reason if the backend is streaming a response and we submit a message, the message gets lost
        // setting a timeout for now just to avoid this bug
        setTimeout(() => {
          deepChatElement.submitUserMessage({ text });
        }, delay);
      }
    },
    [deepChatRef]
  );

  const clearChatMessages = () => {
    if (deepChatRef.current) {
      const deepChatElement = deepChatRef.current.children[0] as DeepChatCore;
      return deepChatElement.clearMessages(false);
    }
  };

  const responseInterceptor: DeepChatCore["responseInterceptor"] = useCallback(
    async (res: Message) => {
      if (res.role && res.role.startsWith("client_action:")) {
        const action = res.role.replace("client_action:", "");

        switch (action) {
          case "window.ethereum.request":
            // some kind of system request
            try {
              // @ts-expect-error TODO: update globalThis to include ethereum
              const txHash = await window.ethereum.request(res.text);
              submitChatMessage(`The Transaction Hash is ${txHash}`);
            } catch (err) {
              submitChatMessage(`error encountered: ${JSON.stringify(err)}`);
            }
            break;
          default:
            throw new Error(`unknown ${res.role}`);
        }

        return { text: "" };
      } else {
        return res;
      }
    },
    [submitChatMessage]
  );

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* a wrapper element to get a reference for the getMessages call */}
        <DemoBanner />
        <div ref={deepChatRef}>
          <DeepChat
            responseInterceptor={responseInterceptor}
            chatStyle={{
              borderRadius: "10px",
              width: "100%",
              maxWidth: "1000px",
              margin: "0 auto",
              display: "block",
              height: "calc(100vh - 200px)",
              paddingTop: "10px",
              backgroundColor: "#2D2D2D",
              border: "0px",
            }}
            messageStyles={{
              default: {
                shared: {
                  bubble: {
                    backgroundColor: "unset",
                    color: "rgb(238, 238, 238)",
                    fontWeight: "400",
                    fontSize: `${13 / 16}rem`, // 13px
                    lineHeight: `${18 / 13}`, // 18px
                  },
                  // innerContainer: { fontSize: '1rem' }
                },
                user: {
                  bubble: { backgroundColor: "rgb(254, 96, 95)" },
                },
                ai: {
                  bubble: { backgroundColor: "#1E1E1E" },
                },
              },
            }}
            // inputAreaStyle={{ fontSize: '1rem' }}
            textInput={{
              styles: {
                text: {
                  color: "#EEEEEE",
                  fontWeight: "400",
                  fontSize: `${13 / 16}rem`, // 13px
                  lineHeight: `${18 / 13}`, // 18px
                },
                container: {
                  backgroundColor: "#2D2D2D",
                  boxShadow: "unset",
                  borderColor: "rgb(238, 238, 238)",
                  borderWidth: "1px",
                },
              },
            }}
            submitButtonStyles={{
              submit: {
                container: {
                  default: {
                    backgroundColor: "rgb(254, 96, 95)",
                    width: "50px",
                  },
                  click: { backgroundColor: "rgb(255, 182, 182)" },
                },
                text: {
                  content: "Send",
                  styles: {
                    default: {
                      color: "rgb(238, 238, 238)",
                    },
                    click: {
                      color: "rgb(255, 182, 182)",
                    },
                  },
                },
              },
              alwaysEnabled: true,
            }}
            introMessage={{
              text: INTRO_MESSAGE,
            }}
            connect={connectionConfig}
            requestBodyLimits={{ maxMessages: 100 }}
            errorMessages={{ displayServiceErrorMessages: true }}
          />
        </div>
        <DeployControls
          getMessages={getChatMessages}
          clearMessages={clearChatMessages}
        />
      </main>
    </>
  );
}
