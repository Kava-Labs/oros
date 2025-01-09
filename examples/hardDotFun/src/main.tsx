import { useState, useRef, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import hardDotFunDiamond from './assets/hardDotFunDiamond.svg';
import defaultAvatar from './assets/defaultAvatar.svg';
import './main.css';

const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [tokenData, setTokenData] = useState({
    tokenName: '',
    tokenSymbol: '',
    tokenDescription: '',
    avatarImage: defaultAvatar,
  });
  const [walletInfo, setWalletInfo] = useState({
    address: '',
    chainID: '',
  });

  const iframeRootRef = useRef<HTMLDivElement>(null);

  const openChatHandler = () => {
    const iframeRoot = iframeRootRef.current;

    if (!iframeRoot) return;

    if (isChatOpen) {
      iframeRoot.classList.remove('open');
      iframeRoot.innerHTML = '';
      setIsChatOpen(false);
    } else {
      iframeRoot.classList.add('open');
      iframeRoot.innerHTML = `
        <iframe id="KAVA_CHAT" src="https://chat.app.production.kava.io" style="width: 100%; height: 100%; border: none;"></iframe>
      `;
      setIsChatOpen(true);
    }
  };

  const connectWallet = async (iframe: HTMLIFrameElement) => {
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts[0]) {
        const chainID = (await window.ethereum.request({
          method: 'eth_chainId',
        })) as string;

        setWalletInfo({
          address: accounts[0],
          chainID,
        });

        iframe.contentWindow?.postMessage(
          {
            namespace: 'KAVA_CHAT',
            type: 'WALLET_CONNECTION/V1',
            payload: {
              address: accounts[0],
              walletName: 'MetaMask',
              chainID,
            },
          },
          '*',
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWalletHandler = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe');
    if (!iframe) {
      openChatHandler();
      const iframeLoaded = document.querySelector<HTMLIFrameElement>('iframe');
      iframeLoaded?.addEventListener('load', () => {
        if (iframeLoaded) connectWallet(iframeLoaded);
      });
    } else {
      connectWallet(iframe);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe');
        if (iframe) connectWallet(iframe);
      });

      window.ethereum.on('chainChanged', () => {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe');
        if (iframe) connectWallet(iframe);
      });
    }
  }, []);

  useEffect(() => {
    const iFrameMessageHandler = (event: MessageEvent) => {
      if (event.data.type === 'GENERATED_TOKEN_METADATA') {
        const imageBase64 = event.data.payload.base64ImageData.startsWith(
          'data:',
        )
          ? event.data.payload.base64ImageData
          : `data:image/png;base64,${event.data.payload.base64ImageData}`;

        setTokenData({
          tokenName: event.data.payload.tokenName,
          tokenSymbol: event.data.payload.tokenSymbol,
          tokenDescription: event.data.payload.tokenDescription,
          avatarImage: imageBase64,
        });
      }
    };

    window.addEventListener('message', iFrameMessageHandler);

    return () => {
      window.removeEventListener('message', iFrameMessageHandler);
    };
  }, []);

  return (
    <>
      <div id="chat-container">
        <div className="iframe-root" ref={iframeRootRef}></div>

        <button
          className={`chat-button ${isChatOpen ? 'open' : ''}`}
          aria-label={isChatOpen ? 'Close Chat' : 'Open Chat'}
          onClick={openChatHandler}
        >
          {isChatOpen ? (
            'Close Chat'
          ) : (
            <img src={hardDotFunDiamond} alt="Open Chat Icon" />
          )}
        </button>
      </div>

      <div className="form-container">
        <figure className="avatar-container">
          <div className="avatar-circle">
            <img src={tokenData.avatarImage} alt="Generated Avatar" />
          </div>
        </figure>
        <div className="form-card">
          <h2 id="form-header">Basic Token Info</h2>
          <form>
            <div className="field">
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Token Name"
                  value={tokenData.tokenName}
                  readOnly
                />
              </div>
            </div>
            <div className="field">
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Token Symbol"
                  value={tokenData.tokenSymbol}
                  readOnly
                />
              </div>
            </div>
            <div className="field">
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Description (Optional)"
                  value={tokenData.tokenDescription}
                  readOnly
                ></textarea>
              </div>
            </div>
            <div className="field">
              <div className="control">
                <button
                  className="button button-connect"
                  type="button"
                  onClick={connectWalletHandler}
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </form>
          {walletInfo.address && walletInfo.chainID && (
            <div className="wallet-info">
              <p>
                <strong>Connected Wallet:</strong> {walletInfo.address}
              </p>
              <p>
                <strong>Chain ID:</strong>{' '}
                {walletInfo.chainID.startsWith('0x')
                  ? parseInt(walletInfo.chainID, 16)
                  : walletInfo.chainID}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
