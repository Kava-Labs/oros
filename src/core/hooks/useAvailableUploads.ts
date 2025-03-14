import type { FileUpload, UploadingState } from '../components/ChatInput';
import { Dispatch, SetStateAction, useCallback } from 'react';

interface UseAvailableUploadsParams {
  uploadedFiles: FileUpload[];
  maximumFileUploads: number;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
  resetUploadState: () => void;
}

/**
 * Returns a function that checks if additional file uploads are allowed
 * Sets error state and schedules reset if maximum is reached
 *
 * @param {UseAvailableUploadsParams} params - Function parameters
 * @param {string[]} params.imageIDs - Array of currently uploaded files
 * @param {number} params.maximumFileUploads - Maximum number of files allowed for upload
 * @param {Dispatch<SetStateAction<UploadingState>>} params.setUploadingState - State setter for the uploading state
 * @param {Function} params.resetUploadState - Function to reset the uploading state
 * @returns {Function} Function that returns true if more uploads are allowed, false otherwise
 */
export const useAvailableUploads = ({
  uploadedFiles,
  maximumFileUploads,
  setUploadingState,
  resetUploadState,
}: UseAvailableUploadsParams): (() => boolean) => {
  return useCallback((): boolean => {
    if (uploadedFiles.length >= maximumFileUploads) {
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
    uploadedFiles.length,
    maximumFileUploads,
    setUploadingState,
    resetUploadState,
  ]);
};
