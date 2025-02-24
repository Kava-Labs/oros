import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { Paperclip } from 'lucide-react';

const DEFAULT_HEIGHT = '30px';

interface ChatInputProps {
  onSubmit(value: string): void;
  onCancel(): void;
  setShouldAutoScroll: (s: boolean) => void;
}

const ChatInput = ({
  onSubmit,
  onCancel,
  setShouldAutoScroll,
}: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const { isRequesting, modelConfig } = useAppContext();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

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
      onCancel();
      return;
    }

    if (inputValue === '') {
      return;
    }

    let processedMessage = inputValue;
    if (modelConfig.messageProcessors?.preProcess) {
      processedMessage = modelConfig.messageProcessors.preProcess(inputValue);
    }

    onSubmit(processedMessage);
    setInputValue('');
    setShouldAutoScroll(true); // Reset scroll state when sending new message

    // Reset height after submitting
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  }, [
    isRequesting,
    inputValue,
    modelConfig.messageProcessors,
    onSubmit,
    setShouldAutoScroll,
    onCancel,
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
      alert('Uploaded: ' + file.name);
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

  return (
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
  );
};

export default ChatInput;
