import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { InputAdornmentMessage } from './InputAdornmentMessage';
import { ConversationHistory } from '../context/types';
import { hasSufficientRemainingTokens } from '../utils/conversation/hasSufficientRemainingTokens';
import { useManageContextWarning } from '../hooks/useManageContextWarning';
import { Paperclip, X } from 'lucide-react';
import { saveImage } from '../utils/idb/idb';
import { IdbImage } from './IdbImage';
import ButtonIcon from './ButtonIcon';
import { useTheme } from '../../shared/theme/useTheme';
import { ChatCompletionContentPart } from 'openai/resources/index';

import 'pdfjs-dist/build/pdf.worker.min.mjs';
import * as pdfjsLib from 'pdfjs-dist';
import { pdfDocToBase64ImageUrls } from '../utils/pdf/pdf';

const SUPPORT_FILE_UPLOAD =
  import.meta.env.VITE_FEAT_SUPPORT_FILE_UPLOAD === 'true';

const DEFAULT_HEIGHT = '30px';

const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_UPLOADS = 4;

const MAX_FILE_BYTES = 8 * 1024 * 1024;

interface ChatInputProps {
  setShouldAutoScroll: (s: boolean) => void;
}

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

  const [uploadingState, setUploadingState] = useState({
    isActive: false,
    isSupportedFile: true,
    errorMessage: '',
  });
  const { isActive, isSupportedFile, errorMessage } = uploadingState;

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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [imageIDs, setImageIDs] = useState<string[]>([]);
  const [fileType, setFileType] = useState<string>('');

  const prevModelIdRef = useRef(modelConfig.id);
  const prevConversationRef = useRef(conversationID);

  useEffect(() => {
    if (
      prevModelIdRef.current !== modelConfig.id ||
      prevConversationRef.current !== conversationID
    ) {
      setImageIDs([]);
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

    let processedMessage = inputValue;
    if (modelConfig.messageProcessors?.preProcess) {
      processedMessage = modelConfig.messageProcessors.preProcess(inputValue);
    }

    if (imageIDs.length > 0) {
      const messageContent: ChatCompletionContentPart[] = [
        {
          type: 'text',
          text: processedMessage,
        },
      ];

      imageIDs.forEach((id) => {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: id,
          },
        });
      });

      handleChatCompletion({
        content: messageContent,
        isPDFUpload: fileType === 'application/pdf',
      });

      setImageIDs([]);
    } else {
      handleChatCompletion({ content: processedMessage });
    }

    setFileType('');
    setInputValue('');
    setShouldAutoScroll(true); // Reset scroll state when sending new message

    // Reset height after submitting
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  }, [
    imageIDs,
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

  const hasAvailableUploads = useCallback((): boolean => {
    if (imageIDs.length >= MAX_FILE_UPLOADS) {
      setUploadingState({
        isActive: true,
        isSupportedFile: false,
        errorMessage: `Maximum ${MAX_FILE_UPLOADS} files allowed!`,
      });

      setTimeout(() => {
        resetUploadState();
      }, 2000);

      return false;
    }
    return true;
  }, [imageIDs.length, resetUploadState]);

  const processFile = useCallback(
    async (file: File) => {
      if (!hasAvailableUploads()) {
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage: 'File too large! Maximum file size is 8MB.',
        });

        // Present the error for a short time, then reset
        setTimeout(() => {
          resetUploadState();
        }, 2000);

        return;
      }

      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage:
            'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
        });

        //  Present the error for a short time, then reset
        setTimeout(() => {
          resetUploadState();
        }, 1000);

        return;
      }

      resetUploadState();

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imgID = await saveImage(e.target.result);
          setImageIDs((prevIDs) => [...prevIDs, imgID]);
        } else if (e.target?.result instanceof ArrayBuffer) {
          const images = await pdfDocToBase64ImageUrls(e.target.result, 4);
          for (const img of images) {
            const id = await saveImage(img);
            setImageIDs((prev) => [...prev, id]);
          }
        }
      };

      setFileType(file.type);
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsDataURL(file);
      }
    },
    [resetUploadState, hasAvailableUploads],
  );

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const totalFilesAfterUpdate = imageIDs.length + event.target.files.length;
      if (totalFilesAfterUpdate > MAX_FILE_UPLOADS) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage: `Maximum ${MAX_FILE_UPLOADS} files allowed.`,
        });

        setTimeout(() => {
          resetUploadState();
        }, 2000);
      } else {
        Array.from(event.target.files).forEach((file) => {
          processFile(file);
        });
      }

      if (uploadRef.current) {
        uploadRef.current.value = '';
      }
    }
  };

  const removeImage = (imageIdToRemove: string) => {
    setImageIDs((prevIDs) => prevIDs.filter((id) => id !== imageIdToRemove));
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

  const modelSupportsUpload = modelConfig.supportedFileTypes.length > 0;

  useEffect(() => {
    if (!SUPPORT_FILE_UPLOAD || !modelSupportsUpload) {
      return;
    }
    const handleDragEnter = (e: DragEvent) => {
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
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setUploadingState((prev) => ({
        ...prev,
        isActive: true,
      }));
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      //  Reset if leaving the document (going outside the window)
      if (e.relatedTarget === null) {
        setUploadingState((prev) => ({
          ...prev,
          isActive: false,
        }));
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setUploadingState((prev) => ({
        ...prev,
        isActive: false,
      }));

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const totalFilesAfterDrop = imageIDs.length + files.length;
        if (totalFilesAfterDrop > MAX_FILE_UPLOADS) {
          setUploadingState({
            isActive: true,
            isSupportedFile: false,
            errorMessage: `Maximum ${MAX_FILE_UPLOADS} files allowed.`,
          });

          setTimeout(() => {
            resetUploadState();
          }, 2000);
        } else if (
          Array.from(files).filter((file) => file.size > MAX_FILE_BYTES)
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
    };

    // Add event listeners to the entire app so the user
    // doesn't have to specifically target the input
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
    processFile,
    imageIDs.length,
    hasAvailableUploads,
    resetUploadState,
    modelSupportsUpload,
  ]);

  const [, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

  const noUserInput = inputValue.length === 0 && imageIDs.length === 0;

  const insufficientContext =
    !hasSufficientRemainingTokens(
      modelConfig.id,
      inputValue,
      remainingContextWindow,
    ) || shouldDisableChat;

  const disableSubmit = (!isRequesting && noUserInput) || insufficientContext;

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
      {imageIDs.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          <div className={styles.imagePreviewWrapper}>
            {imageIDs.map((id) => (
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
          {SUPPORT_FILE_UPLOAD && modelSupportsUpload && (
            <>
              <div className={styles.uploadInputFieldContainer}>
                <input
                  accept={SUPPORTED_FILE_TYPES.join(', ')}
                  ref={uploadRef}
                  type="file"
                  className={styles.uploadInputField}
                  onChange={handleUpload}
                  multiple // Allow multiple file selection
                  disabled={imageIDs.length >= MAX_FILE_UPLOADS}
                />
              </div>

              <ButtonIcon
                icon={Paperclip}
                size={16}
                aria-label="Attach file icon"
                className={`${styles.attachIcon} ${imageIDs.length >= MAX_FILE_UPLOADS ? styles.disabled : ''}`}
                onClick={() =>
                  imageIDs.length < MAX_FILE_UPLOADS &&
                  uploadRef.current?.click()
                }
                tooltip={{
                  text: 'Attach file - max 4, 8MB each',
                  position: 'bottom',
                  backgroundColor: colors.bgPrimary,
                }}
                disabled={imageIDs.length >= MAX_FILE_UPLOADS}
              />
            </>
          )}
          <button
            data-testid="chat-view-button"
            ref={buttonRef}
            className={styles.sendChatButton}
            type="submit"
            onClick={handleButtonClick}
            aria-label="Send Chat"
            disabled={disableSubmit}
          >
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
