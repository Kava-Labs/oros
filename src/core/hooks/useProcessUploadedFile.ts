import { Dispatch, SetStateAction, useCallback } from 'react';
import { isSupportedFileType } from '../types/models';
import { UploadingState } from '../components/ChatInput';
import { saveImage } from '../utils/idb/idb';

export interface UseProcessUploadedFileParams {
  hasAvailableUploads: boolean;
  maximumFileBytes: number;
  setUploadingState: (state: UploadingState) => void;
  resetUploadState: () => void;
  setImageIDs: Dispatch<SetStateAction<string[]>>;
}

const useProcessUploadedFile = ({
  hasAvailableUploads, //  todo - remove when extracted to importable function
  maximumFileBytes,
  setUploadingState,
  resetUploadState,
  setImageIDs,
}: UseProcessUploadedFileParams) => {
  return useCallback(
    async (file: File) => {
      if (!hasAvailableUploads) {
        return;
      }

      if (file.size > maximumFileBytes) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage: 'File too large! Maximum file size is 8MB.',
        });

        //   the error for a short time, then reset
        setTimeout(() => {
          resetUploadState();
        }, 2000);

        return;
      }

      if (!isSupportedFileType(file.type)) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage:
            'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
        });

        setTimeout(() => {
          resetUploadState();
        }, 2000);

        return;
      }

      resetUploadState();

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imgID = await saveImage(e.target.result);
          setImageIDs((prevIDs) => [...prevIDs, imgID]);
        }
      };
      reader.readAsDataURL(file);
    },
    [
      hasAvailableUploads,
      maximumFileBytes,
      resetUploadState,
      setImageIDs,
      setUploadingState,
    ],
  );
};

export default useProcessUploadedFile;
