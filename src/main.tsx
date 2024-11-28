import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import './index.css'
import { App } from './App.tsx'
import { AppContextProvider } from './contexts/AppContext.tsx'
import { appStore } from './stores';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={appStore}>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </Provider>
  </StrictMode>,
)
