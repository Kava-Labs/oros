import { UploadingState } from '../components/ChatInput';
import { Dispatch, SetStateAction, useCallback } from 'react';

interface UseAvailableUploadsParams {
  imageIDs: string[];
  maximumFileUploads: number;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
  resetUploadState: () => void;
}

/**
 * Checks if additional file uploads are allowed based on the current state
 * Sets error state and schedules reset if maximum is reached
 *
 * @param {UseAvailableUploadsParams} params - Function parameters
 * @param {string[]} params.imageIDs - Array of image IDs currently uploaded
 * @param {number} params.maximumFileUploads - Maximum number of files allowed for upload
 * @param {Dispatch<SetStateAction<UploadingState>>} params.setUploadingState - State setter for the uploading state
 * @param {Function} params.resetUploadState - Function to reset the uploading state
 * @returns {boolean} True if more uploads are allowed, false otherwise
 */
export const useAvailableUploads = ({
  imageIDs,
  maximumFileUploads,
  setUploadingState,
  resetUploadState,
}: UseAvailableUploadsParams): boolean => {
  return useCallback((): boolean => {
    if (imageIDs.length >= maximumFileUploads) {
      setUploadingState({
        isActive: true,
        isSupportedFile: false,
        errorMessage: `Maximum ${maximumFileUploads} files allowed!`,
      });
      setTimeout(() => {
        resetUploadState();
      }, 2000);
      return false;
    }
    return true;
  }, [
    imageIDs.length,
    maximumFileUploads,
    setUploadingState,
    resetUploadState,
  ])();
};
