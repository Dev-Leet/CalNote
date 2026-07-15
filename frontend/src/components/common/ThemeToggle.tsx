
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleMode}
      className="flex items-center gap-2 rounded-pill border border-border-subtle bg-bg-elevated px-2.5 py-1.5"
    >
      <Sun size={14} className={isDark ? 'text-text-secondary' : 'text-warning'} />
      <span
        className={`relative h-[18px] w-[34px] rounded-pill transition-colors ${
          isDark ? 'bg-accent-ashna' : 'bg-border-subtle'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
            isDark ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      <Moon size={14} className={isDark ? 'text-accent-ashna' : 'text-text-secondary'} />
    </button>
  );
}

export default ThemeToggle;