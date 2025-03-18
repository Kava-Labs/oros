import { useCallback } from 'react';

const RESET_DELAY = 2000;

/**
 * Hook that provides a function to set upload error state with automatic reset
 *
 * @param setUploadingState - The state setter function to update the upload state
 * @returns An object containing the setUploadError function
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

  /**
   * Sets an upload error state and automatically resets it after a delay
   *
   * @param errorMessage - The error message to display
   * @param isSupportedFile - Whether the file type is supported (defaults to false for error states)
   *
   * This function sets the error state with the provided message and automatically resets
   * the state after {@link RESET_DELAY} milliseconds (2000ms).
   */
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
