import { useCallback } from 'react';

const RESET_DELAY = 2000;

/**
 * Hook that provides function to set upload error state with automatic reset
 * @param setUploadingState - The state setter function
 */
export const useUploadingError = (
  setUploadingState: (state: {
    isActive: boolean;
    isSupportedFile: boolean;
    errorMessage: string;
  }) => void,
) => {
  const resetUploadState = useCallback(() => {
    setUploadingState({
      isActive: false,
      isSupportedFile: true,
      errorMessage: '',
    });
  }, [setUploadingState]);

  const setUploadError = useCallback(
    (errorMessage: string, isSupportedFile = false) => {
      setUploadingState({
        isActive: true,
        isSupportedFile,
        errorMessage,
      });

      setTimeout(() => {
        resetUploadState();
      }, RESET_DELAY);
    },
    [resetUploadState, setUploadingState],
  );

  return {
    setUploadError,
  };
};
