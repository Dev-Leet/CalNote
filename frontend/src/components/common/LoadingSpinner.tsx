

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  fullHeight?: boolean;
}

export function LoadingSpinner({ size = 24, label, fullHeight = false }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-2.5 p-6 ${fullHeight ? 'h-full' : ''}`}
    >
      <div
        className="animate-spin rounded-full border-2 border-bg-elevated border-t-accent-ashna"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;