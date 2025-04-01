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

    const handleClick = () => handleUserActivity();
    const handleScroll = () => handleUserActivity();
    const handleKeydown = () => handleUserActivity();
    const handleMousemove = () => handleUserActivity();
    const handleWheel = () => handleUserActivity();
    const handleTouchStart = () => handleUserActivity();

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

    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePagehide);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleMousemove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePagehide);
    };
  }, []);
}
