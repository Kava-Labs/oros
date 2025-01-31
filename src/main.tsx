//
// React Imports
//
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

//
// Global CSS & Fonts
//
import './global.css';

import '@fontsource/inter/300.css';
import '@fontsource/inter/300-italic.css';

import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';

import '@fontsource/inter/500.css';
import '@fontsource/inter/500-italic.css';

import '@fontsource/inter/700.css';
import '@fontsource/inter/700-italic.css';
// import { idbDatabase } from './utils';

// idbDatabase()
//   .then(() => {
//     console.debug('indexedDB initialized');
//   })
//   .catch((err) => {
//     console.error('failed to open indexedDB', err);
//   });

//
// Components & Context
//
import { App } from './App.tsx';
import { ThemeProvider } from './theme/themeProvider.tsx';
import { AppContextProvider } from './context/AppContextProvider.tsx';
import {
  progressStore,
  messageHistoryStore,
  messageStore,
  walletStore,
  toolCallStreamStore,
} from './stores.ts';

//
// Render!
//
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ThemeProvider>
      <AppContextProvider
        progressStore={progressStore}
        messageStore={messageStore}
        toolCallStreamStore={toolCallStreamStore}
        walletStore={walletStore}
        messageHistoryStore={messageHistoryStore}
      >
        <App />
      </AppContextProvider>
    </ThemeProvider>
  </StrictMode>,
);
