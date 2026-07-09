import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAiProviderStore } from '../stores/aiProviderStore';

interface PreferencesDto {
  defaultAiProvider: 'ashna' | 'custom';
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  customAiConfig?: { endpoint: string; model: string; hasApiKey: boolean };
}

interface UpdatePreferencesPayload {
  defaultAiProvider?: 'ashna' | 'custom';
  sleepWindow?: { start: string; end: string };
  notifyBeforeContestMins?: number;
  customAiConfig?: { endpoint: string; apiKey: string; model: string };
}

async function fetchPreferences(): Promise<PreferencesDto> {
  const { data } = await apiClient.get<{ preferences: PreferencesDto }>('/users/me/preferences');
  return data.preferences;
}

async function savePreferences(payload: UpdatePreferencesPayload): Promise<PreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: PreferencesDto }>('/users/me/preferences', payload);
  return data.preferences;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const setGlobalProvider = useAiProviderStore((s) => s.setProvider);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });

  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('06:00');
  const [notifyMins, setNotifyMins] = useState(60);
  const [defaultProvider, setDefaultProvider] = useState<'ashna' | 'custom'>('ashna');
  const [geminiEndpoint, setGeminiEndpoint] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!preferences) return;
    setSleepStart(preferences.sleepWindow.start);
    setSleepEnd(preferences.sleepWindow.end);
    setNotifyMins(preferences.notifyBeforeContestMins);
    setDefaultProvider(preferences.defaultAiProvider);
    if (preferences.customAiConfig) {
      setGeminiEndpoint(preferences.customAiConfig.endpoint);
      setGeminiModel(preferences.customAiConfig.model);
    }
  }, [preferences]);

  const { mutate: mutateGeneral, isPending: isSavingGeneral } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGlobalProvider(data.defaultAiProvider);
      flashSaved('Preferences saved');
    },
  });

  const { mutate: mutateGemini, isPending: isSavingGemini } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setGeminiApiKey(''); // never keep the raw key in local state after save
      flashSaved('Custom AI Agent configuration saved');
    },
  });

  const flashSaved = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    mutateGeneral({
      defaultAiProvider: defaultProvider,
      sleepWindow: { start: sleepStart, end: sleepEnd },
      notifyBeforeContestMins: notifyMins,
    });
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return; // don't submit an empty key overwrite by accident
    mutateGemini({
      customAiConfig: { endpoint: geminiEndpoint, apiKey: geminiApiKey, model: geminiModel },
    });
  };

  if (isLoading) {
    return <p style={{ color: 'var(--color-text-secondary)' }}>Loading settings…</p>;
  }

  return (
    <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h1 style={{ color: 'var(--color-text-primary)', fontSize: '22px', margin: 0 }}>Settings</h1>

      {savedMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--color-success)', color: '#0B0F19', fontSize: '13px' }}>
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSaveGeneral} style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Scheduling Preferences</h2>

        <Field label="Default AI Provider">
          <select value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value as 'ashna' | 'custom')} style={inputStyle}>
            <option value="ashna">Ashna AI</option>
            <option value="custom">Custom AI Agent</option>
          </select>
        </Field>

        <Field label="Sleep Window (IST)">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} style={inputStyle} />
            <span style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}>to</span>
            <input type="time" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} style={inputStyle} />
          </div>
        </Field>

        <Field label="Notify Before Contest (minutes)">
          <input
            type="number"
            min={0}
            max={1440}
            value={notifyMins}
            onChange={(e) => setNotifyMins(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>

        <Field label="Timezone">
          <input type="text" value="Asia/Kolkata (IST)" disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
        </Field>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
          CP Calendar Pro is IST-locked app-wide and isn't user-configurable — see the SRS for why.
        </p>

        <button type="submit" disabled={isSavingGeneral} style={submitStyle(isSavingGeneral)}>
          {isSavingGeneral ? 'Saving…' : 'Save Preferences'}
        </button>
      </form>

      <form onSubmit={handleSaveGemini} style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Custom AI Agent (Gemini) Configuration</h2>
        {preferences?.customAiConfig?.hasApiKey && (
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--color-text-primary)',
  margin: 0,
};

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

export default SettingsPage;
