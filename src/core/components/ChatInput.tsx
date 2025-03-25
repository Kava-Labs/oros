import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { InputAdornmentMessage } from './InputAdornmentMessage';
import { ConversationHistory } from '../context/types';
import { hasSufficientRemainingTokens } from '../utils/conversation/hasSufficientRemainingTokens';
import { useManageContextWarning } from '../hooks/useManageContextWarning';
import { Paperclip, X } from 'lucide-react';
import { IdbImage } from './IdbImage';
import ButtonIcon from './ButtonIcon';
import { useTheme } from '../../shared/theme/useTheme';
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { isSupportedFileType } from '../types/models';
import useProcessUploadedFile from '../hooks/useProcessUploadedFile';
import { useAvailableUploads } from '../hooks/useAvailableUploads';
import { useUploadingError } from '../hooks/useUploadingError';

const DEFAULT_HEIGHT = '30px';

interface ChatInputProps {
  setShouldAutoScroll: (s: boolean) => void;
}

export interface UploadingState {
  isActive: boolean;
  isSupportedFile: boolean;
  errorMessage: string;
}

export type FileUpload = {
  id: string;
  fileName: string;
  fileType: string;
  fileText?: string;
  page?: number;
};

const ChatInput = ({ setShouldAutoScroll }: ChatInputProps) => {
  const [showInputAdornmentMessage, setShowInputAdornmentMessage] =
    useState(false);
  const [dismissWarning, setDismissWarning] = useState(false);

  const { shouldDisableChat } = useManageContextWarning(
    dismissWarning,
    setDismissWarning,
    setShowInputAdornmentMessage,
  );

  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);

  const [uploadingState, setUploadingState] = useState<UploadingState>({
    isActive: false,
    isSupportedFile: true,
    errorMessage: '',
  });
  const { setUploadError } = useUploadingError(setUploadingState);
  const { isActive, isSupportedFile, errorMessage } = uploadingState;

  //  todo - fully deprecate
  const resetUploadState = useCallback(() => {
    setUploadingState({
      isActive: false,
      isSupportedFile: true,
      errorMessage: '',
    });
  }, []);

  const {
    isRequesting,
    modelConfig,
    handleChatCompletion,
    handleCancel,
    conversationID,
  } = useAppContext();

  const { supportedFileTypes, maximumFileUploads, maximumFileBytes } =
    modelConfig;

  const hasAvailableUploads = useAvailableUploads({
    uploadedFiles,
    maximumFileUploads,
    setUploadError,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const prevModelIdRef = useRef(modelConfig.id);
  const prevConversationRef = useRef(conversationID);

  useEffect(() => {
    if (
      prevModelIdRef.current !== modelConfig.id ||
      prevConversationRef.current !== conversationID
    ) {
      setUploadedFiles([]);
      prevModelIdRef.current = modelConfig.id;
      prevConversationRef.current = conversationID;
    }
  }, [conversationID, modelConfig.id]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      /**
       * Set the text area height to 'auto' on change so the height is
       * automatically adjusted as the user types. Set it to the
       * scrollHeight so as the user types, the textarea content moves
       * upward keeping the user on the same line
       */
      const textarea = event.target;
      textarea.style.height = DEFAULT_HEIGHT; // Reset to default height first
      textarea.style.height = `min(${textarea.scrollHeight}px, 60vh)`; // Adjust to scrollHeight
      setInputValue(textarea.value);
    },
    [],
  );

  const handleButtonClick = useCallback(() => {
    if (isRequesting) {
      handleCancel();
      return;
    }

    const newMessages: ChatCompletionMessageParam[] = [];
    let processedMessage = inputValue;
    if (modelConfig.messageProcessors?.preProcess) {
      processedMessage = modelConfig.messageProcessors.preProcess(inputValue);
    }

    if (uploadedFiles.length > 0) {
      // group all pdf uploads together into a system message
      // this is because a single pdf upload creates multiple images
      const groupedPDFFiles: Record<string, FileUpload[]> = {};

      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.fileType === 'application/pdf') {
          if (!groupedPDFFiles[uploadedFile.fileName]) {
            groupedPDFFiles[uploadedFile.fileName] = [];
          }
          // groups all image pages to the same pdf file
          groupedPDFFiles[uploadedFile.fileName].push(uploadedFile);
        }
      }

      for (const [, groupedPdfPages] of Object.entries(groupedPDFFiles)) {
        // make sure we are sorted in ascending order
        groupedPdfPages.sort((a, b) => a.page! - b.page!);
        // push a system message for each pdf document
        newMessages.push({
          role: 'system',
          content: JSON.stringify({
            context: 'user uploaded pdf document and text has been extracted',
            imageIDs: groupedPdfPages.map((p) => p.id), // required for conversation component to show the images
            document: groupedPdfPages.map((p) => ({
              page: p.page,
              content: p.fileText,
            })),
          }),
        });
      }

      const userMessage: ChatCompletionUserMessageParam = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: processedMessage,
          },
        ],
      };

      const nonPdfUploads = uploadedFiles.filter(
        (f) => f.fileType !== 'application/pdf',
      );

      // if we have regular image uploads
      // push all the images into the content of the user message
      if (nonPdfUploads.length) {
        nonPdfUploads.forEach((file) => {
          (userMessage.content as ChatCompletionContentPart[]).push({
            type: 'image_url',
            image_url: { url: file.id },
          });
        });
      }

      // add the user message
      // it should always be the last thing added
      newMessages.push(userMessage);

      handleChatCompletion(newMessages);
      setUploadedFiles([]);
    } else {
      handleChatCompletion([
        {
          role: 'user',
          content: processedMessage,
        },
      ]);
    }

    setInputValue('');
    setShouldAutoScroll(true); // Reset scroll state when sending new message

    // Reset height after submitting
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  }, [
    uploadedFiles,
    isRequesting,
    inputValue,
    modelConfig.messageProcessors,
    handleChatCompletion,
    setShouldAutoScroll,
    handleCancel,
  ]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return;
      }
      event.preventDefault();

      if (!isRequesting && buttonRef.current) {
        buttonRef.current.click();
      }
    }
  };

  const processUploadedFile = useProcessUploadedFile({
    hasAvailableUploads,
    maximumFileBytes,
    maximumFileUploads,
    setUploadingState,
    setUploadedFiles,
    resetUploadState,
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const totalFilesAfterUpdate =
        uploadedFiles.length + event.target.files.length;
      if (totalFilesAfterUpdate > maximumFileUploads) {
        setUploadError(`Maximum ${maximumFileUploads} files allowed.`);
      } else {
        Array.from(event.target.files).forEach((file) => {
          processUploadedFile(file);
        });
      }

      if (uploadRef.current) {
        uploadRef.current.value = '';
      }
    }
  };

  const removeImage = (imageIdToRemove: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((f) => f.id !== imageIdToRemove),
    );
  };

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputRef.current && inputValue === '') {
      inputRef.current.style.height = DEFAULT_HEIGHT;
      setShouldAutoScroll(true); // Reset scroll state when input is cleared
    }
  }, [inputValue, setShouldAutoScroll]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const allConversations: Record<string, ConversationHistory> = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const currentConversation = allConversations[conversationID];

  const remainingContextWindow = currentConversation
    ? currentConversation.tokensRemaining
    : modelConfig.contextLength;

  const modelSupportsUpload = supportedFileTypes.length > 0;

  useDragAndDrop({
    hasAvailableUploads,
    processUploadedFile,
    resetUploadState,
    uploadedFiles,
    modelConfig,
    setUploadingState,
  });

  useEffect(() => {
    if (!modelSupportsUpload) {
      return;
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (!hasAvailableUploads()) {
        return;
      }

      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      Array.from(clipboardItems)
        .filter((clipboardItem) => isSupportedFileType(clipboardItem.type))
        .forEach((item) => {
          const file = item.getAsFile();
          if (file) {
            if (file.size > maximumFileBytes) {
              setUploadError('File too large! Maximum file size is 8MB.');
              return;
            }
            processUploadedFile(file);
          }
        });
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [
    processUploadedFile,
    hasAvailableUploads,
    modelSupportsUpload,
    resetUploadState,
    maximumFileBytes,
    setUploadError,
  ]);

  const [, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

  const noUserInput = inputValue.length === 0 && uploadedFiles.length === 0;

  const insufficientContext =
    !hasSufficientRemainingTokens(
      modelConfig.id,
      inputValue,
      remainingContextWindow,
    ) || shouldDisableChat;

  const disableSubmit = !isRequesting && (noUserInput || insufficientContext);

  return (
    <>
      {showInputAdornmentMessage && (
        <InputAdornmentMessage
          shouldDisableChat={shouldDisableChat}
          onCloseClick={() => {
            setShowInputAdornmentMessage(false);
            setDismissWarning(true);
          }}
        />
      )}
      {uploadedFiles.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          <div className={styles.imagePreviewWrapper}>
            {uploadedFiles.map(({ id }) => (
              <div
                key={id}
                className={styles.imageCard}
                onMouseEnter={() => setHoverImageId(id)}
                onMouseLeave={() => setHoverImageId(null)}
              >
                <IdbImage
                  id={id}
                  width="56px"
                  height="56px"
                  className={styles.cardImage}
                />
                <ButtonIcon
                  icon={X}
                  className={styles.removeButton}
                  onClick={() => removeImage(id)}
                  aria-label="Remove image"
                  size={14}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`${styles.controls} ${isActive ? styles.active : ''} ${isActive && !isSupportedFile ? styles.dropZoneError : ''}`}
      >
        <div className={styles.inputContainer}>
          {isActive ? (
            <div
              className={`${styles.dropZone} ${!isSupportedFile ? styles.dropZoneError : ''}`}
            >
              <span>{errorMessage || 'Drop your image to upload'}</span>
            </div>
          ) : (
            <textarea
              className={styles.input}
              data-testid="chat-view-input"
              rows={1}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              placeholder="Ask anything..."
            />
          )}
        </div>
        <div className={styles.buttonContainer}>
          <div className={styles.buttonWrapper}>
            {modelSupportsUpload && (
              <>
                <div className={styles.uploadInputFieldContainer}>
                  <input
                    accept={supportedFileTypes.join(', ')}
                    ref={uploadRef}
                    type="file"
                    className={styles.uploadInputField}
                    onChange={handleUpload}
                    multiple // Allow multiple file selection
                    disabled={uploadedFiles.length >= maximumFileUploads}
                  />
                </div>

                <ButtonIcon
                  icon={Paperclip}
                  size={16}
                  aria-label="Attach file icon"
                  className={`${styles.attachIcon} ${uploadedFiles.length >= maximumFileUploads ? styles.disabled : ''}`}
                  onClick={() =>
                    uploadedFiles.length < maximumFileUploads &&
                    uploadRef.current?.click()
                  }
                  tooltip={{
                    text: 'Attach file - max 4, 8MB each',
                    position: 'bottom',
                    backgroundColor: colors.bgPrimary,
                  }}
                  disabled={uploadedFiles.length >= maximumFileUploads}
                />
              </>
            )}
            <button
              data-testid="chat-view-button"
              ref={buttonRef}
              className={styles.sendChatButton}
              type="submit"
              onClick={handleButtonClick}
              aria-label={isRequesting ? 'Cancel Chat' : 'Send Chat'}
              disabled={disableSubmit}
            >
              {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
