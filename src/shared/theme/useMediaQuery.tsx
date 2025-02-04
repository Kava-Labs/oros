import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState<boolean>(
    window.matchMedia(query).matches,
  );

  useEffect(() => {
    const matchQuery = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    matchQuery.addEventListener('change', onChange);
    return () => matchQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
