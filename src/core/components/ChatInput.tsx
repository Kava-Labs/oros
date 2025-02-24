import styles from './ChatInput.module.css';
import { CancelChatIcon, SendChatIcon } from '../assets';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { InputAdornmentMessage } from './InputAdornmentMessage';
import { ConversationHistory } from '../context/types';
import { hasSufficientRemainingTokens } from '../utils/conversation/hasSufficientRemainingTokens';
import { useManageContextWarning } from '../hooks/useManageContextWarning';
import { Paperclip, X } from 'lucide-react';

const DEFAULT_HEIGHT = '30px';

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

  const {
    isRequesting,
    modelConfig,
    conversationID,
    handleChatCompletion,
    handleCancel,
  } = useAppContext();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [uploadUrl, setUploadUrl] = useState<string>('');

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

    handleChatCompletion(processedMessage);
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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            setUploadUrl(e.target.result);
          }
        };
        reader.readAsDataURL(file);
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

  const [hover, setHover] = useState(false);

  const [imgHover, setImgHover] = useState(false);

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
      <div>
        {/* {image upload preview} */}
        {uploadUrl ? (
          <div
            className={styles.imageCard}
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
          >
            <img
              width="56px"
              height="56px"
              className={styles.cardImage}
              src={uploadUrl}
            />
            {imgHover ? (
              <X onClick={() => setUploadUrl('')} className={styles.xIcon} />
            ) : null}
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
              disabled={
                (!isRequesting && inputValue.length === 0) ||
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
      </div>
    </>
  );
};

export default ChatInput;
