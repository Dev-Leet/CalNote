import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface PreferencesDto {
  defaultAiProvider: 'ashna' | 'custom';
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  customAiConfig?: { endpoint: string; model: string; hasApiKey: boolean };
}

interface UpdatePreferencesPayload {
  sleepWindow?: { start: string; end: string };
  notifyBeforeContestMins?: number;
}

async function savePreferences(payload: UpdatePreferencesPayload): Promise<PreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: PreferencesDto }>('/users/me/preferences', payload);
  return data.preferences;
}

interface SchedulingPreferencesSectionProps {
  preferences: PreferencesDto;
}

/**
 * Owns sleep window and contest-notification timing — the scheduling-behavior
 * half of preferences, distinct from AiPreferencesSection's provider/Gemini
 * config half. Timezone is displayed but permanently locked (SRS 3.4.3).
 */
export function SchedulingPreferencesSection({ preferences }: SchedulingPreferencesSectionProps) {
  const queryClient = useQueryClient();

  const [sleepStart, setSleepStart] = useState(preferences.sleepWindow.start);
  const [sleepEnd, setSleepEnd] = useState(preferences.sleepWindow.end);
  const [notifyMins, setNotifyMins] = useState(preferences.notifyBeforeContestMins);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setSleepStart(preferences.sleepWindow.start);
    setSleepEnd(preferences.sleepWindow.end);
    setNotifyMins(preferences.notifyBeforeContestMins);
  }, [preferences]);

  const { mutate, isPending } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setSavedMessage('Scheduling preferences saved');
      setTimeout(() => setSavedMessage(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      sleepWindow: { start: sleepStart, end: sleepEnd },
      notifyBeforeContestMins: notifyMins,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Scheduling Preferences</h2>

      {savedMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--color-success)', color: '#0B0F19', fontSize: '13px' }}>
          {savedMessage}
        </div>
      )}

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

      <button type="submit" disabled={isPending} style={submitStyle(isPending)}>
        {isPending ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
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

export default SchedulingPreferencesSection;