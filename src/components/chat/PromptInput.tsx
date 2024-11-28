import { useState } from 'react';
import styles from './style.module.css';

type PromptInputProps = { submitUserMessage: (content: string) => void, cancelStream: null | (() => void) };

export const PromptInput = ({ submitUserMessage, cancelStream }: PromptInputProps) => {
    const [input, setInput] = useState('');

    return (
        <form
            className={styles.promptForm}
            onSubmit={(e) => {
                e.preventDefault();
                submitUserMessage(input);
                setInput('');
            }}
        >
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your prompt here..."
                className={styles.inputField}
            />
            <button type="submit" className={styles.submitButton} onClick={(e) => {
                if (cancelStream) {
                    cancelStream();
                } else {
                    e.preventDefault();
                    submitUserMessage(input);
                    setInput('')
                }
            }}>
                {cancelStream ? "Cancel" : "Submit"}
            </button>
        </form>
    );
};
