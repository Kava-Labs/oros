import { useEffect, useRef } from 'react';

const RAILS_API_BASE_URL =
  import.meta.env.VITE_RAILS_API_BASE_URL || 'http://localhost:3000';
export const sessionUrl = `${RAILS_API_BASE_URL}/session`;
const FIVE_MINUTES = 5 * 60 * 1000;

export function useSession() {
  const lastPingTimeRef = useRef<number>(Date.now());

  const getSession = (keepAlive = false) => {
    lastPingTimeRef.current = Date.now();

    const landingUrl = window.location.href;
    const referrerUrl = document.referrer || 'nil';
    const urlWithParams = buildSessionUrlWithQueryParams(
      sessionUrl,
      landingUrl,
      referrerUrl,
    );

    fetch(urlWithParams, {
      method: 'GET',
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
        getSession(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      } else if (document.visibilityState === 'hidden') {
        getSession(true); // Send keepalive ping before tab closes
      }
    };

    const handlePagehide = () => {
      getSession(true); // Also send keepalive on pagehide
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

export const buildSessionUrlWithQueryParams = (
  baseUrl: string,
  landingPageUrl: string,
  referrerUrl: string,
): string => {
  const sessionUrl = new URL(baseUrl);
  sessionUrl.searchParams.set('landing_page_url', landingPageUrl);
  sessionUrl.searchParams.set('referrer_url', referrerUrl);
  return sessionUrl.toString();
};

export const resetLandingPageUrlQueryParams = (urlString: string): string => {
  const url = new URL(urlString);
  const params = url.searchParams;
  const keysToRemove = [];

  for (const key of params.keys()) {
    if (key.toLowerCase().startsWith('utm_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => params.delete(key));

  return `${url.origin}${url.pathname}${params.toString() ? '?' + params.toString() : ''}`;
};
