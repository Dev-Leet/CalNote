
interface PlatformFilterBarProps {
  platforms: string[]; // includes 'all' as the first entry
  active: string;
  onChange: (platform: string) => void;
}

export function PlatformFilterBar({ platforms, active, onChange }: PlatformFilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {platforms.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-pressed={active === p}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            background: active === p ? 'var(--color-accent-ashna)' : 'var(--color-bg-elevated)',
            color: active === p ? '#0B0F19' : 'var(--color-text-secondary)',
            textTransform: 'capitalize',
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export default PlatformFilterBar;
