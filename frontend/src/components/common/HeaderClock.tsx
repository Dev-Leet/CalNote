import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useClockFormatStore } from '../../stores/clockFormatStore';

function formatTime(date: Date, format: '12h' | '24h'): string {
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (format === '24h') {
    return `${String(hours24).padStart(2, '0')}:${minutes}:${seconds}`;
  }

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${period}`;
}

/**
 * Live IST clock in the header, hh:mm:ss, click to toggle 12h/24h — the
 * toggle IS the "settings" surface for this preference (persisted via
 * clockFormatStore), rather than a separate Settings-page control, since
 * it's a single lightweight binary choice tied directly to the display it affects.
 */
export function HeaderClock() {
  const format = useClockFormatStore((s) => s.format);
  const toggleFormat = useClockFormatStore((s) => s.toggleFormat);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleFormat}
      title={`Click to switch to ${format === '24h' ? '12-hour' : '24-hour'} format`}
      className="flex items-center gap-1.5 rounded-pill border border-border-subtle bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-primary"
    >
      <Clock size={13} className="text-text-secondary" />
      {formatTime(now, format)}
      <span className="text-[10px] text-text-secondary">IST</span>
    </button>
  );
}

export default HeaderClock;