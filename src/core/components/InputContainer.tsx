import styles from './ChatView.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useTheme } from '../../shared/theme/useTheme';

interface InputContainerProps {
  onSubmit(value: string): void;

  onCancel(): void;

  cautionText: string;
}

const InputContainer = ({
  onSubmit,
  onCancel,
  cautionText,
}: InputContainerProps) => {
  const { isRequesting, modelConfig } = useAppContext();
  const [inputValue, setInputValue] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      /**
       * Set the text area height to 'auto' on change so the height is
       * automatically adjusted as the user types. Set it to the
       * scrollHeight so as the user types, the textarea content moves
       * upward keeping the user on the same line
       */
      const textarea = event.target;
      textarea.style.height = 'auto';
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
  }, [isRequesting, inputValue, onSubmit, onCancel, modelConfig]);

  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const { colors } = useTheme();

  return (
    <div id={styles.controls} data-testid="controls">
      <div id={styles.inputContainer}>
        <textarea
          id={styles.input}
          data-testid="chat-view-input"
          rows={1}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
        ></textarea>

        <button
          data-testid="chat-view-button"
          ref={buttonRef}
          id={styles.sendChatButton}
          type="submit"
          onClick={handleButtonClick}
          aria-label="Send Chat"
        >
          {isRequesting ? (
            <CancelChatIcon color={colors.accentTransparent} />
          ) : (
            <SendChatIcon color={colors.accentTransparent} />
          )}
        </button>
      </div>
      <span id={styles.importantInfo} data-testid="importantInfo">
        <p>{cautionText}</p>
      </span>
    </div>
  );
};

export default InputContainer;
