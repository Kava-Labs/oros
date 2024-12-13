import { useState } from 'react';
import styles from '../style.module.css';
import { useHasToolCallInProgress } from '../../../stores';
import { useAppContext } from '../../../contexts/AppContext';

type PromptInputProps = {
  submitUserMessage: (content: string) => void;
  cancelStream: null | (() => void);
};

export const PromptInput = ({
  submitUserMessage,
  cancelStream,
}: PromptInputProps) => {
  const { messageHistoryStore } = useAppContext();

  const [input, setInput] = useState('');
  const hasToolCallInProgress = useHasToolCallInProgress(messageHistoryStore);

  return (
    <form
      data-testid="PromptInput"
      role="form"
      className={styles.promptForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (!input) return;
        submitUserMessage(input);
        setInput('');
      }}
    >
      <input
        type="text"
        value={input}
        role="textbox"
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your prompt here..."
        className={styles.inputField}
      />
      <button
        type="submit"
        role="button"
        className={styles.submitButton}
        disabled={hasToolCallInProgress}
        onClick={(e) => {
          e.preventDefault();
          if (cancelStream) {
            cancelStream();
          } else {
            if (!input) return;
            submitUserMessage(input);
            setInput('');
          }
        }}
      >
        {cancelStream ? 'Cancel' : 'Submit'}
      </button>
    </form>
  );
};
