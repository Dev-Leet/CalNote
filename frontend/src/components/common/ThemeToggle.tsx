
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid var(--color-border-subtle)`,
        background: 'var(--color-bg-elevated)',
        cursor: 'pointer',
      }}
    >
      <Sun size={14} style={{ color: isDark ? 'var(--color-text-secondary)' : 'var(--color-warning)' }} />
      <span
        style={{
          position: 'relative',
          width: '34px',
          height: '18px',
          borderRadius: 'var(--radius-pill)',
          background: isDark ? 'var(--color-accent-ashna)' : 'var(--color-border-subtle)',
          transition: 'background 150ms ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: isDark ? '18px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left 150ms ease',
          }}
        />
      </span>
      <Moon size={14} style={{ color: isDark ? 'var(--color-accent-ashna)' : 'var(--color-text-secondary)' }} />
    </button>
  );
}

export default ThemeToggle;