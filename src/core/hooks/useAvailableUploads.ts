import { UploadingState } from '../components/ChatInput';
import { Dispatch, SetStateAction } from 'react';

interface UseAvailableUploadsProps {
  imageIDs: string[];
  maximumFileUploads: number;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
  resetUploadState: () => void;
}

export const useAvailableUploads = ({
  imageIDs,
  maximumFileUploads,
  setUploadingState,
  resetUploadState,
}: UseAvailableUploadsProps) => {
  const hasAvailableUploads = (): boolean => {
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

  return {
    hasAvailableUploads,
  };
};
