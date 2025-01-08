import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const IFRAME_ORIGIN = 'http://localhost:3000/';

const setOrosConfig = (
  cw: Window,
  cfg: {
    systemPrompt: string;
    introText: string;
    tools: any[];
  },
) => {
  cw.postMessage(
    {
      namespace: 'KAVA_CHAT',
      type: 'SET_INTRO_TEXT/V1',
      payload: {
        introText: cfg.introText,
      },
    },
    IFRAME_ORIGIN,
  );

  cw.postMessage(
    {
      namespace: 'KAVA_CHAT',
      type: 'SET_SYSTEM_PROMPT/V1',
      payload: {
        systemPrompt: cfg.systemPrompt,
      },
    },
    IFRAME_ORIGIN,
  );

  cw.postMessage(
    {
      namespace: 'KAVA_CHAT',
      type: 'SET_TOOLS/V1',
      payload: {
        tools: cfg.tools,
      },
    },
    IFRAME_ORIGIN,
  );
};

const App = () => {
  const orosRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const onIframeLoaded = () => {
    if (orosRef.current?.contentWindow) {
      setLoaded(true);
      setOrosConfig(orosRef.current.contentWindow, {
        introText: 'hi', // todo: set up
        systemPrompt: 'hello', // todo: set up
        tools: [], // todo: add a tool call
      });
    }
  };

  useEffect(() => {
    if (!loaded) {
      return;
    }

    // todo: register a listener to read events from the iframe
  }, [loaded]);

  return (
    <div>
      <div>
        <button
          style={{ marginBottom: '16px' }}
          onClick={() => {
            // todo: connect to metamask
          }}
        >
          Connect To Metamask
        </button>
      </div>
      <div>
        <iframe
          onLoad={onIframeLoaded}
          id="OROS_APP"
          src={IFRAME_ORIGIN}
          width="600px"
          height="800px"
          ref={orosRef}
        />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
