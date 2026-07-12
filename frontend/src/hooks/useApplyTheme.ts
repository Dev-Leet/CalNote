import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

/**
 * Applies the current theme mode as a data-theme attribute on <html>, which
 * is what tokens.css's [data-theme='light'] selector targets. This is the
 * missing link — the CSS block existed since Phase 16, but nothing ever
 * called this to actually toggle it.
 */
export function useApplyTheme(): void {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [mode]);
}