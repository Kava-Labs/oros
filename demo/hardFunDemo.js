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
    // Remove custom styles in case someone has had close chat open
    openChatButton.style.color = '';
    openChatButton.style.background = '';
    openChatButton.style.border = '';
  } else {
    iframeRoot.classList.add('open');
    iframeRoot.innerHTML = `
      <iframe id="KAVA_CHAT" src="http://localhost:3000" style="width: 100%; height: 100%; border: none;"></iframe>
    `;
    openChatButton.innerText = 'Close Chat';
    // make it look like hard.fun chat styling
    openChatButton.style.color = 'rgb(247, 73, 40)';
    openChatButton.style.background = '#070303';
    openChatButton.style.border = '1px solid rgb(247, 73, 40)';
  }
});

window.addEventListener('message', (event) => {
  if (event.data.type && event.data.type === 'GENERATED_TOKEN_METADATA') {
    // log the metadata to the console for devs
    console.log('tokenMetadata', event.data.payload);

    // Render the image
    const imageBase64 = event.data.payload.base64ImageData.startsWith('data:')
      ? event.data.payload.base64ImageData
      : `data:image/png;base64,${event.data.payload.base64ImageData}`;
    document.getElementById('token-avatar').innerHTML = `
      <img
        alt="Model Generated Image"
        src="${imageBase64}"
        style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"
      />
    `;

    // Populate the input fields
    document.getElementById('token-name-input').value =
      event.data.payload.tokenName;

    document.getElementById('token-symbol-input').value =
      event.data.payload.tokenSymbol;

    document.getElementById('token-description-input').value =
      event.data.payload.tokenDescription;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // Clear input fields
  document.getElementById('token-name-input').value = '';
  document.getElementById('token-symbol-input').value = '';
  document.getElementById('token-description-input').value = '';

  // Clear token avatar
  document.getElementById('token-avatar').innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="40"
      height="40"
      color="#9e9c9b"
      fill="none"
    >
      <path
        d="M17.4776 9.01106C17.485 9.01102 17.4925 9.01101 17.5 9.01101C19.9853 9.01101 22 11.0294 22 13.5193C22 15.8398 20.25 17.7508 18 18M17.4776 9.01106C17.4924 8.84606 17.5 8.67896 17.5 8.51009C17.5 5.46695 15.0376 3 12 3C9.12324 3 6.76233 5.21267 6.52042 8.03192M17.4776 9.01106C17.3753 10.1476 16.9286 11.1846 16.2428 12.0165M6.52042 8.03192C3.98398 8.27373 2 10.4139 2 13.0183C2 15.4417 3.71776 17.4632 6 17.9273M6.52042 8.03192C6.67826 8.01687 6.83823 8.00917 7 8.00917C8.12582 8.00917 9.16474 8.38194 10.0005 9.01101"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12 13L12 21M12 13C11.2998 13 9.99153 14.9943 9.5 15.5M12 13C12.7002 13 14.0085 14.9943 14.5 15.5"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
});
