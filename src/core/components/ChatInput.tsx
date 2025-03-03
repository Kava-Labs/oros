import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Paperclip, X } from 'lucide-react';
import { saveImage } from '../utils/idb/idb';
import { IdbImage } from './IdbImage';

const DEFAULT_HEIGHT = '30px';

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ChatInputProps {
  setShouldAutoScroll: (s: boolean) => void;
}

const ChatInput = ({ setShouldAutoScroll }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const { isRequesting, modelConfig, handleChatCompletion, handleCancel } =
    useAppContext();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [imageID, setImageID] = useState<string>('');

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

    if (inputValue === '') {
      return;
    }

    let processedMessage = inputValue;
    if (modelConfig.messageProcessors?.preProcess) {
      processedMessage = modelConfig.messageProcessors.preProcess(inputValue);
    }

    if (imageID.length) {
      console.log([
        {
          type: 'text',
          text: processedMessage,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageID,
          },
        },
      ]);
      handleChatCompletion([
        {
          type: 'text',
          text: processedMessage,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageID,
          },
        },
      ]);

      setImageID('');
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
    imageID,
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

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      console.log(file);

      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        alert('Invalid file type! Please upload a JPEG, PNG, or WebP image.');
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imgID = await saveImage(e.target.result);
          setImageID(imgID);
        }
      };
      reader.readAsDataURL(file);
    }
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

  const [hover, setHover] = useState(false);

  const [imgHover, setImgHover] = useState(false);

  return (
    <div>
      {/* {image upload preview} */}
      {imageID ? (
        <div className={styles.imageCardContainer}>
          <div
            className={styles.imageCard}
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
          >
            <IdbImage
              id={imageID}
              width="56px"
              height="56px"
              className={styles.cardImage}
            />
            {imgHover ? (
              <X onClick={() => setImageID('')} className={styles.xIcon} />
            ) : null}
          </div>
        </div>
      ) : null}

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
            disabled={!isRequesting && inputValue.length === 0}
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
            />
          </div>

          <Paperclip
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            color={hover ? '#FFFFFF' : 'rgb(180 180 180)'}
            width="30px"
            height="30px"
            cursor="pointer"
            onClick={() => uploadRef.current?.click()}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
