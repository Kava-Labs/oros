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

  // Change from single imageID to array of image IDs
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
      // Create array with text content first
      const messageContent: ChatCompletionContentPart[] = [
        {
          type: 'text',
          text: processedMessage,
        },
      ];

      // Add each image as a separate content item
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
      // Instead of an alert, set the drag state with an error
      setDragState(
        true,
        false,
        'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
      );

      // Clear the error message after a shorter delay
      setTimeout(() => {
        setDragState(false);
      }, 1500);

      return;
    }

    // Reset drag state
    setDragState(false);

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

  // Set up global drag and drop handlers
  useEffect(() => {
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
          setDragState(
            true,
            isValid,
            isValid
              ? undefined
              : 'Invalid file type! Please upload a JPEG, PNG, or WebP image.',
          );
        } else {
          // If we can't determine file type, just show the generic drag state
          setDragState(true);
        }
      } else {
        // Generic drag state if we can't access file info
        setDragState(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Keep the dragging state active, but don't update validation here
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only reset if leaving the window or moving to a child element
      if (e.relatedTarget === null) {
        setDragState(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Reset the general drag state
      setDragState(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        // Process all dropped files
        Array.from(files).forEach((file) => {
          processFile(file);
        });
      }
    };

    // Add event listeners to document
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
  }, [setDragState]);

  const [hoverImageId, setHoverImageId] = useState<string | null>(null);

  const { colors } = useTheme();

  return (
    <div>
      {/* Image upload previews */}
      {imageIDs.length > 0 && (
        <div className={styles.imageCardContainer}>
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
              {hoverImageId === id && (
                <X onClick={() => removeImage(id)} className={styles.xIcon} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.inputContainer}>
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
