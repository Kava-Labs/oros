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
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { isSupportedFileType } from '../types/models';

const DEFAULT_HEIGHT = '30px';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

interface ChatInputProps {
  setShouldAutoScroll: (s: boolean) => void;
}

export interface UploadingState {
  isActive: boolean;
  isSupportedFile: boolean;
  errorMessage: string;
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

  const [uploadingState, setUploadingState] = useState<UploadingState>({
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

  const { supportedFileTypes, maximumFileUploads } = modelConfig;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [imageIDs, setImageIDs] = useState<string[]>([]);

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

      handleChatCompletion(messageContent);

      setImageIDs([]);
    } else {
      handleChatCompletion(processedMessage);
    }

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
    if (imageIDs.length >= maximumFileUploads) {
      setUploadingState({
        isActive: true,
        isSupportedFile: false,
        errorMessage: `Maximum ${maximumFileUploads} files allowed!`,
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

      if (!isSupportedFileType(file.type)) {
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
        }
      };
      reader.readAsDataURL(file);
    },
    [resetUploadState, hasAvailableUploads],
  );

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const totalFilesAfterUpdate = imageIDs.length + event.target.files.length;
      if (totalFilesAfterUpdate > maximumFileUploads) {
        setUploadingState({
          isActive: true,
          isSupportedFile: false,
          errorMessage: `Maximum ${maximumFileUploads} files allowed.`,
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

  const modelSupportsUpload = supportedFileTypes.length > 0;

  useDragAndDrop({
    hasAvailableUploads,
    processFile,
    resetUploadState,
    imageIDs,
    supportedFileTypes,
    maximumFileUploads,
    MAX_FILE_BYTES,
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
        .filter((item) => SUPPORTED_FILE_TYPES.includes(item.type))
        .forEach((item) => {
          const file = item.getAsFile();
          if (file) {
            if (file.size > MAX_FILE_BYTES) {
              setUploadingState({
                isActive: true,
                isSupportedFile: false,
                errorMessage: 'File too large! Maximum file size is 8MB.',
              });

              setTimeout(() => {
                resetUploadState();
              }, 2000);

              return;
            }
            processFile(file);
          }
        });
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [processFile, hasAvailableUploads, modelSupportsUpload, resetUploadState]);

  const [, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

  const noUserInput = inputValue.length === 0 && imageIDs.length === 0;

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
                    disabled={imageIDs.length >= maximumFileUploads}
                  />
                </div>

                <ButtonIcon
                  icon={Paperclip}
                  size={16}
                  aria-label="Attach file icon"
                  className={`${styles.attachIcon} ${imageIDs.length >= maximumFileUploads ? styles.disabled : ''}`}
                  onClick={() =>
                    imageIDs.length < maximumFileUploads &&
                    uploadRef.current?.click()
                  }
                  tooltip={{
                    text: 'Attach file - max 4, 8MB each',
                    position: 'bottom',
                    backgroundColor: colors.bgPrimary,
                  }}
                  disabled={imageIDs.length >= maximumFileUploads}
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
      </div>
    </>
  );
};

export default ChatInput;
