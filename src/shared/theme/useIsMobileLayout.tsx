import { useMediaQuery } from './useMediaQuery';

export const useIsMobileLayout = () => useMediaQuery('(max-width: 768px)');
