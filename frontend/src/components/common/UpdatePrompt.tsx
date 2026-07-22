
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Surfaces when a new deployed version's service worker has finished
 * installing in the background and is waiting to activate. Per Phase 1's
 * registerType: 'prompt' choice, this requires an explicit user click —
 * never silently swaps the running app out from under mid-edit form state.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for updates periodically while the app is open — otherwise
      // a user who leaves the tab open for hours/days would never learn a
      // new version is available.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000); // hourly
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex w-80 items-start gap-3 rounded-lg bg-bg-surface p-4 shadow-elevated">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success-tint">
        <RefreshCw size={18} className="text-success" />
      </div>
      <div className="flex-1">
        <p className="m-0 text-[13px] font-semibold text-text-primary">Update available</p>
        <p className="m-0 mt-1 text-xs text-text-secondary">
          A new version of CP Calendar Pro is ready. Refresh to update — any unsaved changes on this page will be lost.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="rounded-pill bg-success px-3 py-1.5 text-xs font-semibold text-bg-primary"
          >
            Refresh Now
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="rounded-pill bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary"
          >
            Later
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss"
        className="flex-shrink-0 text-text-secondary"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default UpdatePrompt;