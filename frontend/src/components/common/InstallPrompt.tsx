import React from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DISMISSED_KEY = 'cp-calendar-pro:install-prompt-dismissed-at';

/**
 * A dismissible, bottom-corner card — deliberately NOT a modal or anything
 * blocking, since installability is a nice-to-have the user should be able
 * to ignore without friction. Only renders when the browser has actually
 * fired beforeinstallprompt (real install eligibility), never a fake
 * "install our app!" banner shown unconditionally.
 */
export function InstallPrompt() {
  const { canInstall, promptInstall, isIosManualInstall } = useInstallPrompt();
  const [hidden, setHidden] = React.useState(false);

  if ((!canInstall && !isIosManualInstall) || hidden) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    // The hook only clears its own deferredEvent after a completed
    // prompt() call — a plain "Not now" dismiss (no prompt shown) needs
    // this component's own local state to hide it for the rest of the session.
    setHidden(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-80 items-start gap-3 rounded-lg bg-bg-surface p-4 shadow-elevated">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-ashna-tint">
        <Download size={18} className="text-accent-ashna" />
      </div>
      <div className="flex-1">
        <p className="m-0 text-[13px] font-semibold text-text-primary">Install CP Calendar Pro</p>
        <p className="m-0 mt-1 text-xs text-text-secondary">
          {isIosManualInstall
            ? 'Tap the Share icon, then "Add to Home Screen" for faster access and a full-screen experience.'
            : 'Add to your home screen for faster access and a full-screen experience.'}
        </p>
        <div className="mt-3 flex gap-2">
          {!isIosManualInstall && (
            <button
              type="button"
              onClick={() => promptInstall()}
              className="rounded-pill bg-accent-ashna px-3 py-1.5 text-xs font-semibold text-bg-primary"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-pill bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary"
          >
            {isIosManualInstall ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
      <button type="button" onClick={handleDismiss} aria-label="Dismiss" className="flex-shrink-0 text-text-secondary">
        <X size={14} />
      </button>
    </div>
  );
}

export default InstallPrompt;