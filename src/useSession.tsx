import { useEffect, useRef } from 'react';

const RAILS_API_BASE_URL = import.meta.env.VITE_RAILS_API_BASE_URL ?? '';
export const sessionUrl = `${RAILS_API_BASE_URL}/session`;
const FIVE_MINUTES = 5 * 60 * 1000;

export function useSession() {
  const lastPingTimeRef = useRef<number>(Date.now());

  const getSession = () => {
    lastPingTimeRef.current = Date.now();
    fetch(sessionUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    }).catch(() => {
      // silently fail
    });
  };

  const postHeartbeat = (keepAlive = false) => {
    lastPingTimeRef.current = Date.now();
    fetch(sessionUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      keepalive: keepAlive,
    }).catch(() => {
      // silently fail
    });
  };

  useEffect(() => {
    getSession(); // Initial session ping on mount

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastPingTimeRef.current >= FIVE_MINUTES) {
        postHeartbeat();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      } else if (document.visibilityState === 'hidden') {
        postHeartbeat(true); // Send keepalive ping before tab closes
      }
    };

    const handlePagehide = () => {
      postHeartbeat(true); // Also send keepalive on pagehide
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
