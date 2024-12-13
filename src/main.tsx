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
import { idbDatabase } from './utils';

idbDatabase()
  .then(() => {
    console.debug('indexedDB initialized');
  })
  .catch((err) => {
    console.error('failed to open indexedDB', err);
  });

//
// Components & Context
//
import { App } from './App.tsx';
import { AppContextProvider } from './contexts/AppContext.tsx';
import { messageHistoryStore, streamingMessageStore } from './stores/index.ts';

//
// Render!
//
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <AppContextProvider
      streamingMessageStore={streamingMessageStore}
      messageHistoryStore={messageHistoryStore}
    >
      <App />
    </AppContextProvider>
  </StrictMode>,
);
