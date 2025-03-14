import { Dispatch, SetStateAction, useCallback } from 'react';
import { isSupportedFileType } from '../types/models';
import type { FileUpload, UploadingState } from '../components/ChatInput';
import { saveImage } from '../utils/idb/idb';
import { pdfDocExtractTextAndImage } from '../utils/pdf';

export interface UseProcessUploadedFileParams {
  hasAvailableUploads: () => boolean;
  maximumFileBytes: number;
  maximumFileUploads: number;
  setUploadingState: (state: UploadingState) => void;
  resetUploadState: () => void;
  setUploadedFiles: Dispatch<SetStateAction<FileUpload[]>>;
}

const useProcessUploadedFile = ({
  hasAvailableUploads, //  todo - remove when extracted to importable function
  maximumFileBytes,
  maximumFileUploads,
  setUploadingState,
  resetUploadState,
  setUploadedFiles,
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
            'Invalid file type! Please upload a JPEG, PNG, WebP, or PDF file',
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
          setUploadedFiles((prev) => [
            ...prev,
            { fileType: file.type, id: imgID, fileName: file.name },
          ]);
        } else if (
          e.target?.result instanceof ArrayBuffer &&
          file.type === 'application/pdf'
        ) {
          const pdfDocData = await pdfDocExtractTextAndImage(
            e.target.result,
            maximumFileUploads,
          );

          for (const pdfPage of pdfDocData) {
            const id = await saveImage(pdfPage.base64ImageURL);

            setUploadedFiles((prev) => [
              ...prev,
              {
                id,
                fileName: file.name,
                fileType: file.type,
                fileText: pdfPage.text,
                page: pdfPage.pageNumber,
              },
            ]);
          }
        }
      };

      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsDataURL(file);
      }
    },
    [
      hasAvailableUploads,
      maximumFileBytes,
      resetUploadState,
      maximumFileUploads,
      setUploadedFiles,
      setUploadingState,
    ],
  );
};

export default useProcessUploadedFile;
