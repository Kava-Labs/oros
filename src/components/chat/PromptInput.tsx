import { useState } from 'react';
import styles from './style.module.css';

type PromptInputProps = { submitUserMessage: (content: string) => void, cancelStream: null | (() => void) };

export const PromptInput = ({ submitUserMessage, cancelStream }: PromptInputProps) => {
    const [input, setInput] = useState('');

    return (
        <form
            role='form'
            className={styles.promptForm}
            onSubmit={(e) => {
                e.preventDefault();
                if (!input) return;
                submitUserMessage(input);
                setInput('');
            }}
        >
            <input
                type='text'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your prompt here..."
                className={styles.inputField}
            />
            <button type="submit" className={styles.submitButton} onClick={(e) => {
                e.preventDefault();
                if (cancelStream) {
                    cancelStream();
                } else {
                    if (!input) return;
                    submitUserMessage(input);
                    setInput('')
                }
            }}>
                {cancelStream ? "Cancel" : "Submit"}
            </button>
        </form>
    );
};
