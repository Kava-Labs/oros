import { useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { UploadingState } from '../components/ChatInput';

interface UseHandleDragAndDropParams {
  modelSupportsUpload: boolean;
  hasAvailableUploads: () => boolean;
  processFile: (file: File) => Promise<void>;
  resetUploadState: () => void;
  imageIDs: string[];
  SUPPORTED_FILE_TYPES: string[];
  MAX_FILE_UPLOADS: number;
  MAX_FILE_BYTES: number;
  setUploadingState: Dispatch<SetStateAction<UploadingState>>;
}

/**
 * Custom hook that implements file drag and drop functionality for the application.
 * It manages the entire lifecycle of drag and drop operations including validation,
 * state updates, and file processing.
 *
 * @param params - Configuration parameters for the drag and drop behavior
 * @param params.modelSupportsUpload - Flag indicating if the current model supports file uploads
 * @param params.hasAvailableUploads - Function that checks if more uploads are allowed
 * @param params.processFile - Function that handles processing a valid file
 * @param params.resetUploadState - Function that resets the uploading state
 * @param params.imageIDs - Array of currently uploaded image IDs
 * @param params.SUPPORTED_FILE_TYPES - Array of accepted MIME types
 * @param params.MAX_FILE_UPLOADS - Maximum number of files allowed
 * @param params.MAX_FILE_BYTES - Maximum file size in bytes
 * @param params.setUploadingState - State setter for the uploading state
 *
 * @returns void - This hook doesn't return any values but sets up event listeners
 */
export const useHandleDragAndDrop = ({
  modelSupportsUpload,
  hasAvailableUploads,
  processFile,
  resetUploadState,
  imageIDs,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_UPLOADS,
  MAX_FILE_BYTES,
  setUploadingState,
}: UseHandleDragAndDropParams) => {
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
          const isValid = SUPPORTED_FILE_TYPES.includes(fileType);
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
    [hasAvailableUploads, SUPPORTED_FILE_TYPES, setUploadingState],
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

        // First check if any file has an unsupported type
        const hasUnsupportedType = Array.from(files).some(
          (file) => !SUPPORTED_FILE_TYPES.includes(file.type),
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
        } else if (totalFilesAfterDrop > MAX_FILE_UPLOADS) {
          setUploadingState({
            isActive: true,
            isSupportedFile: false,
            errorMessage: `Maximum ${MAX_FILE_UPLOADS} files allowed.`,
          });

          setTimeout(() => {
            resetUploadState();
          }, 2000);
          return;
        } else if (
          Array.from(files).some((file) => file.size > MAX_FILE_BYTES)
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
            processFile(file);
          });
        }
      }
    },
    [
      imageIDs.length,
      MAX_FILE_BYTES,
      MAX_FILE_UPLOADS,
      SUPPORTED_FILE_TYPES,
      processFile,
      resetUploadState,
      setUploadingState,
    ],
  );

  useEffect(() => {
    if (!modelSupportsUpload) {
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
    modelSupportsUpload,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  ]);
};
