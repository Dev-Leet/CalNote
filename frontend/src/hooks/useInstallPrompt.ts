import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptResult {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  /** True on iOS Safari, where beforeinstallprompt doesn't exist at all —
   *  the UI must show manual "tap Share, then Add to Home Screen"
   *  instructions instead of a one-click install button. */
  isIosManualInstall: boolean;
}

const DISMISSED_KEY = 'cp-calendar-pro:install-prompt-dismissed-at';
const RE_PROMPT_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // don't re-nag for 14 days after a dismissal

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1); // iPadOS reports as Mac UA
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua); // exclude Chrome/Firefox/Edge on iOS, which are Safari-engine wrappers but still lack beforeinstallprompt
  return isIos && isSafari;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches ?? (window.navigator as { standalone?: boolean }).standalone ?? false,
  );
  const [isIosManualInstall] = useState(isIosSafari);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // suppress the browser's own mini-infobar; we render our own UI instead

      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < RE_PROMPT_AFTER_MS) {
        return; // respect a recent dismissal — don't hold onto the event to re-show it
      }

      setDeferredEvent(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setDeferredEvent(null); // a captured prompt event can only be used once, regardless of outcome
  }, [deferredEvent]);

  return {
    canInstall: !!deferredEvent,
    isInstalled,
    promptInstall,
    isIosManualInstall: isIosManualInstall && !isInstalled,
  };
}