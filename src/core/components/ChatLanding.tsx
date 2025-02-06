import styles from './ChatView.module.css';
import InputContainer from './InputContainer';
import { useTheme } from '../../shared/theme/useTheme';

interface ChatLandingProps {
  introText: string;
  cautionText: string;

  onSubmit(value: string): void;

  onCancel(): void;
}

const ChatLanding = ({
  introText,
  onSubmit,
  onCancel,
  cautionText,
}: ChatLandingProps) => {
  const { logo } = useTheme();

  return (
    <div id={styles.startContainer}>
      <div id={styles.start} data-testid="start">
        <img src={logo} id={styles.chatIconContainer} />
        <h3>Let's get started!</h3>
        <h6>{introText}</h6>
        <InputContainer
          onSubmit={onSubmit}
          onCancel={onCancel}
          cautionText={cautionText}
        />
      </div>
    </div>
  );
};

export default ChatLanding;
