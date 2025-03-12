import { useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { isSupportedFileType, ModelConfig } from '../types/models';
import { UploadingState } from '../components/ChatInput';

export interface UseHandleDragAndDropParams {
  hasAvailableUploads: boolean;
  processUploadedFile: (file: File) => Promise<void>;
  resetUploadState: () => void;
  imageIDs: string[];
  modelConfig: ModelConfig;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
}

/**
 * Custom hook that implements file drag and drop functionality for the application.
 * It manages the entire lifecycle of drag and drop operations including validation,
 * state updates, and file processing.
 *
 * @param params - Configuration parameters for the drag and drop behavior
 * @param params.hasAvailableUploads - Boolean for if more uploads are allowed
 * @param params.@param params.imageIDs - Array of currently uploaded image IDs - Function that handles processing a valid file
>>>>>>> 64a35e3 (refactor: hasAvailableUploads as boolean)
 * @param params.resetUploadState - Function that resets the uploading state
 * @param params.imageIDs - Array of currently uploaded image IDs
 * @param params.modelConfig - Configuration object that defines upload constraints
 * @param params.setUploadingState - State setter for the uploading state
 * @returns void - This hook doesn't return any values but sets up event listeners
 */
export const useDragAndDrop = ({
  hasAvailableUploads,
  processUploadedFile,
  resetUploadState,
  imageIDs,
  modelConfig,
  setUploadingState,
}: UseHandleDragAndDropParams) => {
  const { maximumFileUploads, maximumFileBytes } = modelConfig;

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!hasAvailableUploads) {
        return;
      }

      //  Check if we can access the file type during drag & validate
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];

        if (item.kind === 'file') {
          const fileType = item.type;
          const isValid = isSupportedFileType(fileType);
          setUploadingState({
            isActive: true,
            isSupportedFile: isValid,
            errorMessage: isValid
              ? ''
              : 'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
          });
        }
      }
    },
    [hasAvailableUploads, setUploadingState],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setUploadingState((prev) => ({
        ...prev,
        isActive: true,
      }));
    },
    [setUploadingState],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      //  Reset if leaving the document (going outside the window)
      if (e.relatedTarget === null) {
        setUploadingState((prev) => ({
          ...prev,
          isActive: false,
        }));
      }
    },
    [setUploadingState],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setUploadingState((prev) => ({
        ...prev,
        isActive: false,
      }));

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const totalFilesAfterDrop = imageIDs.length + files.length;

        const hasUnsupportedType = Array.from(files).some(
          (file) => !isSupportedFileType(file.type),
        );

        if (hasUnsupportedType) {
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
        } else if (totalFilesAfterDrop > maximumFileUploads) {
          setUploadingState({
            isActive: true,
            isSupportedFile: false,
            errorMessage: `Maximum ${maximumFileUploads} files allowed.`,
          });

          setTimeout(() => {
            resetUploadState();
          }, 2000);
          return;
        } else if (
          Array.from(files).some((file) => file.size > maximumFileBytes)
        ) {
          setUploadingState({
            isActive: true,
            isSupportedFile: false,
            errorMessage: 'File too large! Maximum file size is 8MB.',
          });

          setTimeout(() => {
            resetUploadState();
          }, 2000);
          return;
        } else {
          Array.from(files).forEach((file) => {
            processUploadedFile(file);
          });
        }
      }
    },
    [
      imageIDs.length,
      maximumFileBytes,
      maximumFileUploads,
      processUploadedFile,
      resetUploadState,
      setUploadingState,
    ],
  );

  useEffect(() => {
    if (maximumFileUploads === 0) {
      return;
    }

    //  Add event listeners to the entire app so the user
    //  doesn't have to specifically target the input
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    maximumFileUploads,
  ]);
};
