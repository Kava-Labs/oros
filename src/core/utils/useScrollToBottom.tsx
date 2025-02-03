import { useEffect } from 'react';

export const useScrollToBottom = (
  onRendered?: () => void,
  isOperationValidated?: boolean,
) => {
  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered, isOperationValidated]);
};
