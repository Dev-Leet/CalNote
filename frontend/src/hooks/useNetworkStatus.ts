import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // true if the connection was JUST restored this session — useful for "back online" toast
}

/**
 * Tracks browser-level connectivity via the standard online/offline events.
 * This detects "no network at all" — it does NOT detect "network is fine
 * but Render's backend is asleep/waking up," which is a distinct state
 * handled separately by React Query's own error/retry behavior on actual
 * failed requests (see queryClient.ts's retry config and each page's
 * isError handling).
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}