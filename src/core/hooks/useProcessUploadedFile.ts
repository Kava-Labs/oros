import { Dispatch, SetStateAction, useCallback } from 'react';

interface UseProcessUploadedFileParams {
  hasAvailableUploads: () => boolean;
  maximumFileBytes: number;
  setUploadingState: (state: {
    isActive: boolean;
    isSupportedFile: boolean;
    errorMessage: string;
  }) => void;
  resetUploadState: () => void;
  isSupportedFileType: (fileType: string) => boolean;
  saveImage: (dataUrl: string) => Promise<string>;
  setImageIDs: Dispatch<SetStateAction<string[]>>;
}

const useProcessUploadedFile = ({
  hasAvailableUploads,
  maximumFileBytes,
  setUploadingState,
  resetUploadState,
  isSupportedFileType,
  saveImage,
  setImageIDs,
}: UseProcessUploadedFileParams) => {
  return useCallback(
    async (file: File) => {
      if (!hasAvailableUploads()) {
        return;
      }

      if (file.size > maximumFileBytes) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage: 'File too large! Maximum file size is 8MB.',
        });

        //  Present the error for a short time, then reset
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
      reader.onload = async (e: ProgressEvent<FileReader>) => {
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
      isSupportedFileType,
      resetUploadState,
      setUploadingState,
      saveImage,
      setImageIDs,
    ],
  );
};

export default useProcessUploadedFile;
