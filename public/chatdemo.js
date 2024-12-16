document.getElementById('open_chat').addEventListener('click', () => {
  const iframeRoot = document.getElementById('iframe-root');
  const openChatButton = document.getElementById('open_chat');

  if (iframeRoot.classList.contains('open')) {
    iframeRoot.classList.remove('open');
    iframeRoot.innerHTML = '';
    openChatButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="#1a1a1a"/>
        <circle cx="100" cy="100" r="20" fill="#4a90e2"/>
        <circle cx="65" cy="65" r="12" fill="#4a90e2" opacity="0.9"/>
        <circle cx="135" cy="65" r="12" fill="#4a90e2" opacity="0.9"/>
        <circle cx="135" cy="135" r="12" fill="#4a90e2" opacity="0.9"/>
        <circle cx="65" cy="135" r="12" fill="#4a90e2" opacity="0.9"/>
        <line x1="75" y1="75" x2="90" y2="90" stroke="#4a90e2" stroke-width="3"/>
        <line x1="125" y1="75" x2="110" y2="90" stroke="#4a90e2" stroke-width="3"/>
        <line x1="125" y1="125" x2="110" y2="110" stroke="#4a90e2" stroke-width="3"/>
        <line x1="75" y1="125" x2="90" y2="110" stroke="#4a90e2" stroke-width="3"/>
        <path d="M65,65 Q100,40 135,65" fill="none" stroke="#4a90e2" stroke-width="2.5" opacity="0.7"/>
        <path d="M135,65 Q160,100 135,135" fill="none" stroke="#4a90e2" stroke-width="2.5" opacity="0.7"/>
        <path d="M135,135 Q100,160 65,135" fill="none" stroke="#4a90e2" stroke-width="2.5" opacity="0.7"/>
        <path d="M65,135 Q40,100 65,65" fill="none" stroke="#4a90e2" stroke-width="2.5" opacity="0.7"/>
        <circle cx="82" cy="82" r="3" fill="#4a90e2" opacity="0.8"/>
        <circle cx="118" cy="82" r="3" fill="#4a90e2" opacity="0.8"/>
        <circle cx="118" cy="118" r="3" fill="#4a90e2" opacity="0.8"/>
        <circle cx="82" cy="118" r="3" fill="#4a90e2" opacity="0.8"/>
      </svg>
    `;
  } else {
    iframeRoot.classList.add('open');
    iframeRoot.innerHTML = `
      <iframe id="KAVA_CHAT" src="http://localhost:3000" style="width: 100%; height: 100%; border: none;"></iframe>
    `;
    openChatButton.innerText = 'Close Chat';
  }
});

window.addEventListener('message', (event) => {
  if (event.data.type && event.data.type === 'GENERATED_TOKEN_METADATA') {
    // render the received data from the iFrame

    document.getElementById('token-avatar').innerHTML = `
      <img
        alt="Model Generated Image"
        src="data:image/png;base64,${event.data.payload.base64ImageData}"
      />
    `;

    document.getElementById('token-name-input').innerHTML =
      event.data.payload.tokenName;
    document.getElementById('token-symbol-input').innerHTML =
      event.data.payload.tokenSymbol;
    document.getElementById('token-description-input').innerHTML =
      event.data.payload.tokenDescription;

    //   document.getElementById('GENERATED_TOKEN_METADATA').innerHTML = `
    // <h1>Received iFrame message from chat App</h1>
    // <h3>Name: ${event.data.payload.tokenName}</h3>
    // <h3>Symbol: ${event.data.payload.tokenSymbol}</h3>
    // <h3>Description</h3>
    // <p>${event.data.payload.tokenDescription}</p>
    // <h3>Token Image</h3>
    // <img
    //   alt="Model Generated Image"
    //   src="data:image/png;base64,${event.data.payload.base64ImageData}"
    // />
    //   `;
  }
});
