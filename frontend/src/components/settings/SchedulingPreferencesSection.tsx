import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { UserPreferencesDto } from '../../types/shared';

interface UpdatePreferencesPayload {
  sleepWindow?: { start: string; end: string };
  notifyBeforeContestMins?: number;
}

const DEFAULT_SLEEP_WINDOW = { start: '23:00', end: '06:00' };
const DEFAULT_NOTIFY_MINS = 60;

async function savePreferences(payload: UpdatePreferencesPayload): Promise<UserPreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: UserPreferencesDto }>('/users/me/preferences', payload);
  return data.preferences;
}

interface SchedulingPreferencesSectionProps {
  preferences: UserPreferencesDto;
}

export function SchedulingPreferencesSection({ preferences }: SchedulingPreferencesSectionProps) {
  const queryClient = useQueryClient();

  const [sleepStart, setSleepStart] = useState(preferences.sleepWindow?.start ?? DEFAULT_SLEEP_WINDOW.start);
  const [sleepEnd, setSleepEnd] = useState(preferences.sleepWindow?.end ?? DEFAULT_SLEEP_WINDOW.end);
  const [notifyMins, setNotifyMins] = useState(preferences.notifyBeforeContestMins ?? DEFAULT_NOTIFY_MINS);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setSleepStart(preferences.sleepWindow?.start ?? DEFAULT_SLEEP_WINDOW.start);
    setSleepEnd(preferences.sleepWindow?.end ?? DEFAULT_SLEEP_WINDOW.end);
    setNotifyMins(preferences.notifyBeforeContestMins ?? DEFAULT_NOTIFY_MINS);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
      <h2 className="m-0 text-base text-text-primary">Scheduling Preferences</h2>

      {!preferences.sleepWindow && (
        <p className="m-0 text-xs text-text-secondary">Default settings applied.</p>
      )}

      {savedMessage && (
        <div className="rounded-md bg-success px-3.5 py-2.5 text-[13px] text-bg-primary">{savedMessage}</div>
      )}

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Sleep Window (IST)
        <div className="flex gap-2">
          <input
            type="time"
            value={sleepStart}
            onChange={(e) => setSleepStart(e.target.value)}
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
          <span className="self-center text-text-secondary">to</span>
          <input
            type="time"
            value={sleepEnd}
            onChange={(e) => setSleepEnd(e.target.value)}
            className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Notify Before Contest (minutes)
        <input
          type="number"
          min={0}
          max={1440}
          value={notifyMins}
          onChange={(e) => setNotifyMins(Number(e.target.value))}
          className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Timezone
        <input
          type="text"
          value="Asia/Kolkata (IST)"
          disabled
          className="w-full cursor-not-allowed rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary opacity-60"
        />
      </label>
      <p className="m-0 text-xs text-text-secondary">
        CP Calendar Pro is IST-locked app-wide and isn't user-configurable — see the SRS for why.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className={`self-start rounded-pill bg-accent-ashna px-5 py-2.5 text-sm font-semibold text-bg-primary ${
          isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        {isPending ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
  );
}

export default SchedulingPreferencesSection;