import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClockFormat = '12h' | '24h';

interface ClockFormatState {
  format: ClockFormat;
  toggleFormat: () => void;
}

/**
 * Purely a display preference — not scheduling-relevant (unlike sleepWindow
 * or timezone), so it stays client-only via persisted Zustand rather than
 * round-tripping through the backend User preferences model.
 */
export const useClockFormatStore = create<ClockFormatState>()(
  persist(
    (set, get) => ({
      format: '24h',
      toggleFormat: () => set({ format: get().format === '24h' ? '12h' : '24h' }),
    }),
    { name: 'cp-calendar-pro:clock-format', version: 1 },
  ),
);