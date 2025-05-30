import { useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { isSupportedFileType, ModelConfig } from '../types/models';
import type { FileUpload, UploadingState } from '../components/ChatInput';

export interface UseHandleDragAndDropParams {
  hasAvailableUploads: () => boolean;
  processUploadedFile: (file: File) => Promise<void>;
  resetUploadState: () => void;
  uploadedFiles: FileUpload[];
  modelConfig: ModelConfig;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
}

/**
 * Custom hook that implements file drag and drop functionality for the application.
 * It manages the entire lifecycle of drag and drop operations including validation,
 * state updates, and file processing.
 *
 * @param {UseHandleDragAndDropParams} params - Configuration parameters for the drag and drop behavior
 *  @param {Function} params.hasAvailableUploads - Function that checks if more uploads are allowed
 *  @param {Function} params.processUploadedFile - Function that handles processing a valid file
 *  @param {Function} params.resetUploadState - Function that resets the uploading state
 *  @param {FileUpload[]} params.imageIDs - Array of currently uploaded files
 *  @param {ModelConfig} params.modelConfig - Configuration object that defines upload constraints
 *  @param {Dispatch<SetStateAction<UploadingState>>} params.setUploadingState - State setter for the uploading state
 *  @returns {void} This hook doesn't return any values but sets up event listeners
 */
export const useDragAndDrop = ({
  hasAvailableUploads,
  processUploadedFile,
  resetUploadState,
  uploadedFiles,
  modelConfig,
  setUploadingState,
}: UseHandleDragAndDropParams): void => {
  const { maximumFileUploads, maximumFileBytes } = modelConfig;

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!hasAvailableUploads()) {
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
        const totalFilesAfterDrop = uploadedFiles.length + files.length;

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
      uploadedFiles.length,
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
