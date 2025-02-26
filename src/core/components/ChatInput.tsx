import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { InputAdornmentMessage } from './InputAdornmentMessage';
import { ConversationHistory } from '../context/types';
import { hasSufficientRemainingTokens } from '../utils/conversation/hasSufficientRemainingTokens';

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
  const [showInputAdornmentMessage, setShowInputAdornmentMessage] =
    useState(false);
  const [inputValue, setInputValue] = useState('');

  const { isRequesting, modelConfig, conversationID } = useAppContext();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <>
      <InputAdornmentMessage
        showInputAdornmentMessage={showInputAdornmentMessage}
        setShowInputAdornmentMessage={setShowInputAdornmentMessage}
      />
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
              (!isRequesting && inputValue.length === 0) ||
              !hasSufficientRemainingTokens(
                modelConfig.id,
                inputValue,
                remainingContextWindow,
              )
            }
          >
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
