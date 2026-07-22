
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * A persistent, unmissable banner (not a toast that can be missed) when
 * the browser has no network connection at all. Distinguishes this from
 * "backend is slow/asleep" (which is a per-request loading state each page
 * already handles) — this banner is specifically for the offline case,
 * where NOTHING will succeed regardless of retries.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium ${
        isOnline ? 'bg-success text-bg-primary' : 'bg-warning text-bg-primary'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={14} /> Back online — data will refresh automatically.
        </>
      ) : (
        <>
          <WifiOff size={14} /> You're offline. Showing your last saved data — AI scheduling and code execution need a
          connection.
        </>
      )}
    </div>
  );
}

export default OfflineBanner;