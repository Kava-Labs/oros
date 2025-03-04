import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Paperclip, X } from 'lucide-react';
import { saveImage } from '../utils/idb/idb';
import { IdbImage } from './IdbImage';
import ButtonIcon from './ButtonIcon';
import { useTheme } from '../../shared/theme/useTheme';
import { ChatCompletionContentPart } from 'openai/resources/index';

const DEFAULT_HEIGHT = '30px';

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ChatInputProps {
  setShouldAutoScroll: (s: boolean) => void;
  setDragState: (
    isDragging: boolean,
    isValidFile?: boolean,
    errorMessage?: string,
  ) => void;
}

const ChatInput = ({ setShouldAutoScroll, setDragState }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const { isRequesting, modelConfig, handleChatCompletion, handleCancel } =
    useAppContext();

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

  const processFile = async (file: File) => {
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      // Set error state
      setIsDragValid(false);
      setDragErrorMessage(
        'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
      );

      // Clear the error message after a short delay
      setTimeout(() => {
        setIsDragging(false);
        setIsDragValid(true);
        setDragErrorMessage('');
      }, 1500);

      // Also notify parent if needed
      if (setDragState) {
        setDragState(
          true,
          false,
          'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
        );
        setTimeout(() => setDragState(false), 1500);
      }

      return;
    }

    // Reset drag states
    setIsDragging(false);
    setIsDragValid(true);
    setDragErrorMessage('');

    // Also reset parent drag state if needed
    if (setDragState) {
      setDragState(false);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target && typeof e.target.result === 'string') {
        const imgID = await saveImage(e.target.result);
        // Add new image ID to the array
        setImageIDs((prevIDs) => [...prevIDs, imgID]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      // Process each file in the selection
      Array.from(event.target.files).forEach((file) => {
        processFile(file);
      });

      // Clear the input value to allow selecting the same file again
      if (uploadRef.current) {
        uploadRef.current.value = '';
      }
    }
  };

  // Function to remove a specific image
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

  // Track drag state internally
  const [isDragging, setIsDragging] = useState(false);
  const [isDragValid, setIsDragValid] = useState(true);
  const [dragErrorMessage, setDragErrorMessage] = useState('');
  const controlsRef = useRef<HTMLDivElement>(null);

  // Set up drag and drop handlers for the entire app
  useEffect(() => {
    // Handler functions
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if we can access the file type during drag
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];

        // If we can determine the file type during drag, validate it
        if (item.kind === 'file') {
          const fileType = item.type;
          const isValid = SUPPORTED_FILE_TYPES.includes(fileType);
          setIsDragValid(isValid);
          setDragErrorMessage(
            isValid
              ? ''
              : 'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
          );
        }
      }

      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Keep the dragging state active
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only reset if leaving the document (going outside the window)
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Reset the drag state
      setIsDragging(false);

      // Only handle drops specifically on the controls element
      if (
        controlsRef.current &&
        controlsRef.current.contains(e.target as Node)
      ) {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          // Process all dropped files
          Array.from(files).forEach((file) => {
            processFile(file);
          });
        }
      }
    };

    // Add event listeners to the document (entire app)
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      // Clean up
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const [, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

  return (
    <div className={styles.chatInputContainer}>
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
                {
                  <button
                    className={styles.removeButton}
                    onClick={() => removeImage(id)}
                    aria-label="Remove image"
                  >
                    <X className={styles.xIcon} size={14} />
                  </button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={controlsRef}
        className={`${styles.controls} ${isDragging ? styles.dragging : ''}`}
      >
        <div className={styles.inputContainer}>
          {isDragging ? (
            <div
              className={`${styles.dropZone} ${!isDragValid ? styles.dropZoneError : ''}`}
            >
              <span>{dragErrorMessage || 'Drop your image to upload'}</span>
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
              !isRequesting && inputValue.length === 0 && imageIDs.length === 0
            }
          >
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>

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
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
