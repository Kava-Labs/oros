document.getElementById('open_chat').addEventListener('click', () => {
  const iframeRoot = document.getElementById('iframe-root');
  const openChatButton = document.getElementById('open_chat');

  if (iframeRoot.classList.contains('open')) {
    iframeRoot.classList.remove('open');
    iframeRoot.innerHTML = '';
    openChatButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.5098 -1.2256 182.7769 182.7769" width="182.777px" height="182.777px">
        <defs>
          <clipPath id="clip1_6348_140835">
            <rect width="130.293" height="125.534" fill="white" transform="translate(165.607 -7)" />
          </clipPath>
        </defs>
        <g id="object-2">
          <circle cx="144.711" cy="142.213" r="90" fill="#1a1a1a" stroke="rgba(255, 255, 255, 0.08)" style="transform-box: fill-box; transform-origin: 50% 50%;" transform="matrix(0.999879, 0.015548, -0.015548, 0.999879, -54.832344, -52.050192)" id="object-0" />
          <g clip-path="url(#clip1_6348_140835)" transform="matrix(1, 0, 0, 1, -141.386993, 35.644001)" id="object-1">
            <path d="M182.722 46.7963C182.265 46.0972 182.352 45.2031 182.87 44.5982L195.178 27.8066C195.4 27.5041 195.696 27.289 196.025 27.1747L212.985 19.841C213.227 19.7402 213.469 19.6931 213.711 19.6931H247.811C248.127 19.6864 248.43 19.767 248.692 19.9149L265.49 27.1747C265.82 27.289 266.115 27.5108 266.337 27.8066L278.672 44.6318C278.82 44.8133 278.928 45.0216 279.002 45.2435L279.035 45.3779C279.149 45.8552 279.075 46.366 278.786 46.803L232.29 117.707L232.277 117.727L232.27 117.747V117.767H232.263H232.257L232.243 117.787L232.216 117.828V117.834L232.163 117.902V117.908L232.156 117.922V117.929L232.142 117.949H232.136V117.955V117.969H232.129L232.122 117.989L232.102 118.003L232.095 118.023V118.029L232.068 118.05L232.062 118.063L231.994 118.117H231.988L231.981 118.13L231.934 118.171H231.927L231.921 118.184L231.88 118.204L231.86 118.224C231.712 118.318 231.558 118.386 231.403 118.433L231.376 118.439C231.295 118.46 231.221 118.48 231.141 118.493L231.107 118.5H231.06H231.02H230.979H230.711L230.67 118.493H230.63H230.59V118.486H230.549L230.543 118.48H230.509H230.502L230.475 118.473H230.462L230.428 118.466H230.415L230.388 118.453H230.374L230.348 118.439H230.307L230.28 118.419H230.26C230.206 118.392 230.159 118.372 230.106 118.352L230.072 118.325L230.025 118.305C229.978 118.278 229.924 118.251 229.877 118.218M189.296 49.8951L224.083 102.945L208.158 58.0489L189.296 49.8884V49.8951ZM166.522 25.8639C165.641 25.3598 165.352 24.2372 165.857 23.3566C166.361 22.4827 167.483 22.187 168.364 22.6911L178.104 28.3174C178.978 28.8216 179.274 29.9442 178.77 30.8248C178.265 31.6986 177.143 31.9944 176.262 31.4902L166.522 25.8639ZM193.081 1.00591C192.577 0.132053 192.872 -0.990522 193.753 -1.50139C194.627 -2.00555 195.749 -1.70978 196.254 -0.829194L201.88 8.911C202.384 9.79158 202.088 10.9074 201.208 11.4183C200.334 11.9225 199.211 11.6267 198.7 10.7461L193.074 1.00591H193.081ZM293.151 22.6911C294.025 22.187 295.148 22.4827 295.659 23.3566C296.163 24.2372 295.867 25.353 294.986 25.8639L285.246 31.4902C284.372 31.9944 283.25 31.6986 282.739 30.8248C282.235 29.9509 282.531 28.8283 283.411 28.3174L293.151 22.6911ZM265.255 -0.829194C265.759 -1.70305 266.882 -2.00555 267.762 -1.50139C268.636 -0.990522 268.932 0.132053 268.428 1.00591L262.801 10.7461C262.297 11.6267 261.175 11.9225 260.294 11.4183C259.414 10.9142 259.118 9.79158 259.629 8.911L265.255 -0.829194ZM228.916 -5.15817C228.916 -6.17319 229.736 -7 230.758 -7C231.779 -7 232.599 -6.17319 232.599 -5.15817V6.09448C232.599 7.1095 231.773 7.92959 230.758 7.92959C229.743 7.92959 228.916 7.1095 228.916 6.09448V-5.15817ZM237.574 102.959L272.36 49.9018L253.491 58.0623L237.574 102.959ZM229.615 118.15L229.588 118.13L229.561 118.097M229.622 118.15L229.554 118.097L229.527 118.07C229.44 117.989 229.366 117.902 229.292 117.808L229.286 117.794L229.272 117.767L229.232 117.713L182.722 46.7963M264.247 31.1474L249.909 37.3518L253.377 54.13L274.424 45.0351L264.247 31.1541V31.1474ZM246.319 38.0913H215.196L211.728 54.8559H249.788L246.319 38.0913ZM211.613 37.3518L197.275 31.1474L187.098 45.0216L208.145 54.1232L211.613 37.3451V37.3518ZM230.764 111.22L249.452 58.5329H212.084L230.771 111.22H230.764ZM214.067 23.3633L201.268 28.8955L214.067 34.4278H247.455L260.254 28.8955L247.455 23.3633H214.067Z" fill="rgb(247, 73, 40, 0.75)" fill-opacity="0.6" />
          </g>
        </g>
      </svg>
    `;
    // Remove custom styles in case someone has had close chat open
    openChatButton.style.color = '';
    openChatButton.style.background = '';
    openChatButton.style.border = '';
  } else {
    iframeRoot.classList.add('open');
    iframeRoot.innerHTML = `
      <iframe id="KAVA_CHAT" src="https://chat.app.production.kava.io" style="width: 100%; height: 100%; border: none;"></iframe>
    `;
    openChatButton.innerText = 'Close Chat';
    // make it look like hard.fun chat styling
    openChatButton.style.color = 'rgb(247, 73, 40, 0.75)';
    openChatButton.style.background = '#1a1a1a';
    openChatButton.style.border = '1px solid rgb(247, 73, 40, 0.75)';
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
