import { useEffect, useState } from 'react';

type SessionResponse = {
  message: string;
  // visitor_id: string;
  // session_id: string;
};

export const useSession = () => {
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/session', {
          method: 'GET',
          credentials: 'omit',
          // credentials: 'include', // important for cookies
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const data: SessionResponse = await response.json();
        console.log(data);
        setSessionData(data);
      } catch (err: any) {
        console.error('Failed to fetch session:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { sessionData, loading, error };
};
