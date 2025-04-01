import { useEffect, useRef } from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

export function useSession() {
  const lastPingTimeRef = useRef<number>(Date.now());

  const pingSession = () => {
    // update current time to track against last ping
    lastPingTimeRef.current = Date.now();
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
    // Initial session ping on mount
    pingSession();

    // Event listeners
    const handleClick = () => handleUserActivity();
    const handleScroll = () => handleUserActivity();

    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

// type SessionResponse = {
//   session_id: string;
//   visitor_id: string;
//   expires_at: string;
//   expired: boolean;
// };

// export const useSession = () => {
//   const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const fetchSession = async () => {
//     try {
//       const response = await fetch('http://localhost:3001/session', {
//         method: 'GET',
//         credentials: 'include', // needed to handle cookies
//       });

//       if (!response.ok) throw new Error(`Status ${response.status}`);

//       const data: SessionResponse = await response.json();
//       console.log('[Session] Fetched:', data);
//       setSessionData(data);
//     } catch (err) {
//       console.error('[Session] Fetch failed:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Initial call
//     fetchSession();

//     // Tab visibility tracking
//     const onVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         fetchSession();
//       }
//     };
//     document.addEventListener('visibilitychange', onVisibilityChange);

//     // 5-minute interval polling only if tab is visible
//     intervalRef.current = setInterval(() => {
//       if (document.visibilityState === 'visible') {
//         fetchSession();
//       }
//     }, 10 * 1000); // 5 minutes

//     // cleanup
//     return () => {
//       document.removeEventListener('visibilitychange', onVisibilityChange);
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, []);

//   return { sessionData, loading };
// };
