import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { generateAgendaPdf } from '../../utils/agendaPdf';

type RangePreset = 'this-week' | 'this-month' | 'next-7-days';

const PRESET_LABEL: Record<RangePreset, string> = {
  'this-week': 'This Week',
  'this-month': 'This Month',
  'next-7-days': 'Next 7 Days',
};

function resolveRange(preset: RangePreset): { from: Date; to: Date; label: string } {
  const now = new Date();

  if (preset === 'next-7-days') {
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { from: now, to, label: 'Next 7 Days' };
  }

  if (preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, label: from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
  }

  // this-week: Monday-Sunday, matching the app's IST/en-IN convention elsewhere
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const from = new Date(now);
  from.setDate(now.getDate() + diffToMonday);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);

  return {
    from,
    to,
    label: `${from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
  };
}

export function ExportAgendaButton() {
  const [preset, setPreset] = useState<RangePreset>('this-week');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const { from, to, label } = resolveRange(preset);
      const events = await eventsApi.list(from.toISOString(), to.toISOString());
      generateAgendaPdf(events, label);
    } catch {
      setError('Could not generate the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value as RangePreset)}
        className="rounded-sm bg-bg-elevated px-2.5 py-1.5 text-[13px] text-text-primary"
      >
        {(Object.keys(PRESET_LABEL) as RangePreset[]).map((key) => (
          <option key={key} value={key}>
            {PRESET_LABEL[key]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleExport}
        disabled={isGenerating}
        className={`flex items-center gap-1.5 rounded-pill bg-bg-elevated px-3.5 py-1.5 text-xs font-semibold text-text-primary ${
          isGenerating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <FileDown size={14} />
        {isGenerating ? 'Generating…' : 'Export Agenda (PDF)'}
      </button>

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export default ExportAgendaButton;