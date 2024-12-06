import styles from "../style.module.css";
import type { ChatCompletionMessageParam } from "openai/resources/index";
import { marked } from "marked";
import { useAppContext } from "../../../contexts/AppContext";
import DOMPurify from "dompurify";

export const StaticMessage = (props: ChatCompletionMessageParam) => {
  const { markDownCache } = useAppContext();

  const content = props.content as string;
  const role = props.role;
  if ((role !== "assistant" && role !== "user") || !content) return null;
  let __html: string | undefined;

  // save the markdown if cache miss
  if (!(__html = markDownCache.current.get(content))) {
    try {
      __html = DOMPurify.sanitize(marked.parse(content, { async: false }));
      markDownCache.current.set(content, __html);
    } catch (err) {
      console.error(err);
      __html = content;
    }
  }

  return (
    <div
      className={
        role === "assistant"
          ? styles.chatBubbleAssistant
          : styles.chatBubbleUser
      }
    >
      <div
        data-chat-role={role}
        className={styles.chatBubble}
        dangerouslySetInnerHTML={{ __html }}
      />
    </div>
  );
};
