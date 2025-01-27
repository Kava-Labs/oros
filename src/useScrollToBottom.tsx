import { useEffect } from 'react';

export const useScrollToBottom = (onRendered?: () => void) => {
  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered]);
};
