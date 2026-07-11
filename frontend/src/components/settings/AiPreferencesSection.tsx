import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAiProviderStore } from '../../stores/aiProviderStore';

interface PreferencesDto {
  defaultAiProvider: 'ashna' | 'custom';
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  customAiConfig?: { endpoint: string; model: string; hasApiKey: boolean };
}

interface UpdatePreferencesPayload {
  defaultAiProvider?: 'ashna' | 'custom';
  customAiConfig?: { endpoint: string; apiKey: string; model: string };
}

async function savePreferences(payload: UpdatePreferencesPayload): Promise<PreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: PreferencesDto }>('/users/me/preferences', payload);
  return data.preferences;
}

interface AiPreferencesSectionProps {
  preferences: PreferencesDto;
}

/**
 * Owns everything related to WHICH AI runs scheduling and how the Custom
 * (Gemini) Agent is configured. Split out of the former monolithic
 * SettingsPage per Section 7.6 — SchedulingPreferencesSection owns the
 * sleep window / notification timing half instead.
 */
export function AiPreferencesSection({ preferences }: AiPreferencesSectionProps) {
  const queryClient = useQueryClient();
  const setGlobalProvider = useAiProviderStore((s) => s.setProvider);

  const [defaultProvider, setDefaultProvider] = useState<'ashna' | 'custom'>(preferences.defaultAiProvider);
  const [geminiEndpoint, setGeminiEndpoint] = useState(preferences.customAiConfig?.endpoint ?? '');
  const [geminiModel, setGeminiModel] = useState(preferences.customAiConfig?.model ?? 'gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setDefaultProvider(preferences.defaultAiProvider);
    if (preferences.customAiConfig) {
      setGeminiEndpoint(preferences.customAiConfig.endpoint);
      setGeminiModel(preferences.customAiConfig.model);
    }
  }, [preferences]);

  const flashSaved = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const { mutate: mutateDefaultProvider, isPending: isSavingProvider } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGlobalProvider(data.defaultAiProvider);
      flashSaved('Default AI provider saved');
    },
  });

  const { mutate: mutateGemini, isPending: isSavingGemini } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGeminiApiKey('');
      flashSaved('Custom AI Agent configuration saved');
    },
  });

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    mutateDefaultProvider({ defaultAiProvider: defaultProvider });
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;
    mutateGemini({ customAiConfig: { endpoint: geminiEndpoint, apiKey: geminiApiKey, model: geminiModel } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {savedMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--color-success)', color: '#0B0F19', fontSize: '13px' }}>
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSaveProvider} style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Default AI Provider</h2>

        <Field label="Provider">
          <select value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value as 'ashna' | 'custom')} style={inputStyle}>
            <option value="ashna">Ashna AI</option>
            <option value="custom">Custom AI Agent</option>
          </select>
        </Field>

        <button type="submit" disabled={isSavingProvider} style={submitStyle(isSavingProvider)}>
          {isSavingProvider ? 'Saving…' : 'Save Provider'}
        </button>
      </form>

      <form onSubmit={handleSaveGemini} style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Custom AI Agent (Gemini) Configuration</h2>
        {preferences.customAiConfig?.hasApiKey && (
          <p style={{ fontSize: '12px', color: 'var(--color-success)', margin: 0 }}>
            An API key is currently configured. Submitting a new key below will replace it.
          </p>
        )}

        <Field label="Model">
          <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} style={inputStyle}>
            <option value="gemini-2.5-flash">gemini-2.5-flash (fast, default)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (complex reasoning)</option>
          </select>
        </Field>

        <Field label="Endpoint">
          <input
            type="url"
            placeholder="https://generativelanguage.googleapis.com"
            value={geminiEndpoint}
            onChange={(e) => setGeminiEndpoint(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="API Key">
          <input
            type="password"
            placeholder="Enter to set or replace your Gemini API key"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
        </Field>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Your key is encrypted before storage and never displayed again — this field is write-only.
        </p>

        <button type="submit" disabled={isSavingGemini || !geminiApiKey.trim()} style={submitStyle(isSavingGemini || !geminiApiKey.trim())}>
          {isSavingGemini ? 'Saving…' : 'Save Custom AI Config'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
      {label}
      {children}
    </label>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '20px',
  borderRadius: '14px',
  background: 'var(--color-bg-surface)',
};

const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', color: 'var(--color-text-primary)', margin: 0 };

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  width: '100%',
};

const submitStyle = (disabled: boolean): React.CSSProperties => ({
  alignSelf: 'flex-start',
  padding: '10px 20px',
  borderRadius: '9999px',
  border: 'none',
  background: 'var(--color-accent-ashna)',
  color: '#0B0F19',
  fontWeight: 600,
  fontSize: '14px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

export default AiPreferencesSection;