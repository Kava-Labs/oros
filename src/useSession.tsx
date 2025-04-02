import { useEffect, useRef } from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useSession() {
  const lastPingTimeRef = useRef<number>(Date.now());

  const getSession = () => {
    // update current time to track against last ping
    lastPingTimeRef.current = Date.now();
    // http://localhost:3001/session
    fetch('/session', {
      method: 'GET',
      credentials: 'include',
    }).catch(() => {
      // silently fail
    });
  };

  const postHeartbeat = () => {
    lastPingTimeRef.current = Date.now();
    fetch('/session/heartbeat', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // silently fail
    });
  };

  const sendBeacon = () => {
    navigator.sendBeacon('/session/heartbeat');
  };

  const handleUserActivity = () => {
    const now = Date.now();
    if (now - lastPingTimeRef.current >= FIVE_MINUTES) {
      postHeartbeat();
    }
  };

  useEffect(() => {
    getSession(); // Initial session ping on mount

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      } else if (document.visibilityState === 'hidden') {
        sendBeacon();
      }
    };

    const handlePagehide = () => {
      sendBeacon();
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
