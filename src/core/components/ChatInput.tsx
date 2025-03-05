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

const SUPPORT_FILE_UPLOAD =
  import.meta.env.VITE_FEAT_SUPPORT_FILE_UPLOAD === 'true';

const DEFAULT_HEIGHT = '30px';

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  const [dragState, setDragState] = useState({
    isDragging: false,
    isSupportedFile: true,
    errorMessage: '',
  });
  const { isDragging, isSupportedFile, errorMessage } = dragState;

  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
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

    if (inputValue === '' && imageIDs.length === 0) {
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

  const processFile = useCallback(
    async (file: File) => {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        setDragState({
          isDragging: true,
          isSupportedFile: false,
          errorMessage:
            'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
        });

        //  Present the error for a short time, then reset
        setTimeout(() => {
          resetDragState();
        }, 1000);

        return;
      }

      resetDragState();

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imgID = await saveImage(e.target.result);
          setImageIDs((prevIDs) => [...prevIDs, imgID]);
        }
      };
      reader.readAsDataURL(file);
    },
    [resetDragState],
  );

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      Array.from(event.target.files).forEach((file) => {
        processFile(file);
      });

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

  useEffect(() => {
    if (!SUPPORT_FILE_UPLOAD) {
      return;
    }
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      //  Check if we can access the file type during drag & validate
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];

        if (item.kind === 'file') {
          const fileType = item.type;
          const isValid = SUPPORTED_FILE_TYPES.includes(fileType);
          setDragState({
            isDragging: true,
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
      setDragState((prev) => ({
        ...prev,
        isDragging: true,
      }));
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      //  Reset if leaving the document (going outside the window)
      if (e.relatedTarget === null) {
        setDragState((prev) => ({
          ...prev,
          isDragging: false,
        }));
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragState((prev) => ({
        ...prev,
        isDragging: false,
      }));

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          processFile(file);
        });
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
  }, [processFile]);

  const [, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

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
        className={`${styles.controls} ${isDragging ? styles.dragging : ''} ${isDragging && !isSupportedFile ? styles.dropZoneError : ''}`}
      >
        <div className={styles.inputContainer}>
          {isDragging ? (
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
          <button
            data-testid="chat-view-button"
            ref={buttonRef}
            className={styles.sendChatButton}
            type="submit"
            onClick={handleButtonClick}
            aria-label="Send Chat"
            disabled={
              (!isRequesting &&
                inputValue.length === 0 &&
                imageIDs.length === 0) ||
              !hasSufficientRemainingTokens(
                modelConfig.id,
                inputValue,
                remainingContextWindow,
              ) ||
              shouldDisableChat
            }
          >
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>
          {SUPPORT_FILE_UPLOAD && (
            <>
              <div className={styles.uploadInputFieldContainer}>
                <input
                  accept={SUPPORTED_FILE_TYPES.join(', ')}
                  ref={uploadRef}
                  type="file"
                  className={styles.uploadInputField}
                  onChange={handleUpload}
                  multiple // Allow multiple file selection
                />
              </div>

              <ButtonIcon
                icon={Paperclip}
                aria-label="Attach file icon"
                className={styles.attachIcon}
                onClick={() => uploadRef.current?.click()}
                tooltip={{
                  text: 'Attach file - max 4, 8MB each',
                  position: 'bottom',
                  backgroundColor: colors.bgPrimary,
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatInput;
