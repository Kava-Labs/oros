import { useEffect, useRef } from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useSession() {
  const lastPingTimeRef = useRef<number>(Date.now());

  const pingSession = () => {
    // update current time to track against last ping
    lastPingTimeRef.current = Date.now();
    // http://localhost:3001/session
    fetch('/session', {
      method: 'GET',
      credentials: 'include',
    }).catch(() => {
      // Silently ignore errors
    });
  };

  const handleUserActivity = () => {
    const now = Date.now();
    if (now - lastPingTimeRef.current >= FIVE_MINUTES) {
      pingSession();
    }
  };

  useEffect(() => {
    pingSession(); // Initial ping

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      }

      // Leave this commented until beacon support is ready
      if (document.visibilityState === 'hidden') {
        navigator.sendBeacon('/session');
      }
    };

    const handlePagehide = () => {
      // Commented until backend supports POST/beacon tracking
      navigator.sendBeacon('/session');
    };

    const userActivityEvents = [
      'click',
      'scroll',
      'keydown',
      'mousemove',
      'wheel',
      'touchstart',
    ];

    userActivityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePagehide);

    return () => {
      userActivityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePagehide);
    };
  }, []);
}
