import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AiProviderType = 'ashna' | 'custom';

interface AiProviderState {
  provider: AiProviderType;
  setProvider: (provider: AiProviderType) => void;
  toggleProvider: () => void;
}

/**
 * Holds the active AI provider toggle state (Ashna vs Custom/Gemini).
 * Persisted to localStorage so the user's last choice survives a page reload —
 * this is intentionally the ONE piece of client state allowed to touch
 * browser storage directly via zustand's `persist` middleware (safe here since
 * it's a plain string enum, not sensitive data).
 */
export const useAiProviderStore = create<AiProviderState>()(
  persist(
    (set, get) => ({
      provider: 'ashna',
      setProvider: (provider) => set({ provider }),
      toggleProvider: () =>
        set({ provider: get().provider === 'ashna' ? 'custom' : 'ashna' }),
    }),
    {
      name: 'cp-calendar-pro:ai-provider', // localStorage key
      version: 1,
    },
  ),
);
