import { useEffect, useRef, useState } from 'react';

const IFRAME_ORIGIN = 'http://localhost:3000/';

const tools = [
  {
    type: 'function',
    function: {
      name: 'fetchWeather',
      description: 'gets the current weather for a given place in the US',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'the name of the city',
          },
          state: {
            type: 'string',
            description: 'the name of the state',
          },
        },
        required: ['city', 'state'],
        strict: true,
        additionalProperties: false,
      },
    },
  },
];

// const validateTransactionalToolCall = () => {
//   // check is the user connected if not respond
//   // looks like you need to connect to metamask
//   // check if they have enough balances for what they want to send
//   // if not then respond with: looks like you dont have enough balances
// };

// const sendERC20 = () => {
//   validateTransactionalToolCall();
// };

// const depositLend = () => {
//   validateTransactionalToolCall();
// };

const fetchWeather = async ({
  state,
  city,
}: {
  state: string;
  city: string;
}) => {
  const randomTemperature = Math.floor(Math.random() * (90 - 32 + 1)) + 32;

  await new Promise((resolve) =>
    setTimeout(() => {
      resolve(1);
    }, 2000),
  );

  return {
    city,
    state,
    temperature: randomTemperature,
  };
};

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

export const App = () => {
  const orosRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const msgHandler = async (msg: MessageEvent<any>) => {
      if (msg.data.type === 'TOOL_CALL') {
        const toolCall = msg.data.payload.toolCall;
        console.log(toolCall);
        if (toolCall.function.name === 'fetchWeather') {
          const res = await fetchWeather(toolCall.function.arguments);
          const content = JSON.stringify(res);
          // send the tool call response back to the iframe
          orosRef.current!.contentWindow!.postMessage(
            {
              namespace: 'KAVA_CHAT',
              type: 'TOOL_CALL_RESPONSE/V1',
              payload: {
                toolCall,
                content,
              },
            },
            IFRAME_ORIGIN,
          );
        }
      }
    };

    window.addEventListener('message', msgHandler);

    return () => {
      window.removeEventListener('message', msgHandler);
    };
  }, [loaded]);

  const onIframeLoaded = () => {
    if (orosRef.current?.contentWindow) {
      setLoaded(true);
      setOrosConfig(orosRef.current.contentWindow, {
        introText: 'hi, tell me which city you want the weather for.',
        systemPrompt: 'you help fetch the weather',
        tools,
      });
    }
  };

  return (
    <div>
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
