import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import { App } from './App.tsx';
import { AppContextProvider } from './contexts/AppContext.tsx';
import { appStore } from './stores';

import '@fontsource/inter/300.css';
import '@fontsource/inter/300-italic.css';

import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';

import '@fontsource/inter/500.css';
import '@fontsource/inter/500-italic.css';

import '@fontsource/inter/700.css';
import '@fontsource/inter/700-italic.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={appStore}>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </Provider>
  </StrictMode>,
);
