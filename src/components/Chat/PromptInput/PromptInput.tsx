import { useState } from 'react';
import styles from '../style.module.css';
import { useSelector } from 'react-redux';
import { selectHasToolCallInProgress } from '../../../stores';

type PromptInputProps = {
  submitUserMessage: (content: string) => void;
  cancelStream: null | (() => void);
};

export const PromptInput = ({
  submitUserMessage,
  cancelStream,
}: PromptInputProps) => {
  const [input, setInput] = useState('');
  const hasToolCallInProgress = useSelector(selectHasToolCallInProgress);

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
