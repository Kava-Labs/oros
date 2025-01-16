import React, { createContext, useContext, useState } from 'react';

type ErrorContextType = {
  errorText: string;
  setErrorText: (e: string) => void;
  isReady: boolean;
  setIsReady: (i: boolean) => void;
  isRequesting: boolean;
  setIsRequesting: (i: boolean) => void;
};

const AppContext = createContext<ErrorContextType | undefined>(undefined);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [errorText, setErrorText] = useState('');
  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  const [isRequesting, setIsRequesting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  return (
    <AppContext.Provider
      value={{
        errorText,
        setErrorText,
        isReady,
        setIsReady,
        isRequesting,
        setIsRequesting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
