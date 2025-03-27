//
// React Imports
//
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

//
// Global CSS & Fonts
//
import './shared/theme/global.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/300-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/500-italic.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/600-italic.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/700-italic.css';

//
// Components & Context
//
import { App } from './App.tsx';
import { ThemeProvider } from './shared/theme/themeProvider.tsx';
import { AppContextProvider } from './core/context/AppContextProvider.tsx';
import {
  progressStore,
  messageHistoryStore,
  messageStore,
  thinkingStore,
  errorStore,
} from './core/stores/stores.ts';
import { idbDatabase } from './core/utils/idb/idb.ts';

idbDatabase()
  .then(() => {
    console.debug('indexedDB initialized');
  })
  .catch((err) => {
    console.error('failed to open indexedDB', err);
  });

//
// Render!
//
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ThemeProvider>
      <AppContextProvider
        errorStore={errorStore}
        progressStore={progressStore}
        messageStore={messageStore}
        thinkingStore={thinkingStore}
        messageHistoryStore={messageHistoryStore}
      >
        <App />
      </AppContextProvider>
    </ThemeProvider>
  </StrictMode>,
);
