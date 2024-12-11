//
// React Imports
//
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

//
// Redux Imports
//
import { Provider } from 'react-redux';
import { appStore } from './stores';

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

//
// Components & Context
//
import { App } from './App.tsx';
import { AppContextProvider } from './contexts/AppContext.tsx';

//
// Render!
//
const root = createRoot(
  document.getElementById('root')
);

root.render(
  <StrictMode>
    <Provider store={appStore}>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </Provider>
  </StrictMode>
);
