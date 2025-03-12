import { UploadingState } from '../components/ChatInput';
import { Dispatch, SetStateAction } from 'react';

interface UseAvailableUploadsProps {
  imageIDs: string[];
  maximumFileUploads: number;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
  resetUploadState: () => void;
}

/**
 * Hook to check if additional file uploads are allowed based on the current state
 *
 * @param {string[]} imageIDs - Array of image IDs currently uploaded
 * @param {number} maximumFileUploads - Maximum number of files allowed for upload
 * @param {Dispatch<SetStateAction<UploadingState>>} setUploadingState - State setter for the uploading state
 * @param {Function} resetUploadState - Function to reset the uploading state
 * @returns {{ hasAvailableUploads: () => boolean }} Object containing the hasAvailableUploads function
 */
export const useAvailableUploads = ({
  imageIDs,
  maximumFileUploads,
  setUploadingState,
  resetUploadState,
}: UseAvailableUploadsProps): boolean => {
  if (imageIDs.length >= maximumFileUploads) {
    setUploadingState({
      isActive: true,
      isSupportedFile: false,
      errorMessage: `Maximum ${maximumFileUploads} files allowed.`,
    });

    setTimeout(() => {
      resetUploadState();
    }, 2000);

    return false;
  }
  return true;
};
