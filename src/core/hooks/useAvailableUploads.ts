import type { FileUpload } from '../components/ChatInput';
import { useCallback } from 'react';

interface UseAvailableUploadsParams {
  uploadedFiles: FileUpload[];
  maximumFileUploads: number;
  setUploadError: (errorMessage: string) => void;
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
  setUploadError,
}: UseAvailableUploadsParams): (() => boolean) => {
  return useCallback((): boolean => {
    if (uploadedFiles.length >= maximumFileUploads) {
      setUploadError(`Maximum ${maximumFileUploads} files allowed!`);

      return false;
    }
    return true;
  }, [uploadedFiles.length, maximumFileUploads, setUploadError]);
};
