
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { AccountSection } from '../components/settings/AccountSection';
import { AiPreferencesSection } from '../components/settings/AiPreferencesSection';
import { SchedulingPreferencesSection } from '../components/settings/SchedulingPreferencesSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface PreferencesDto {
  defaultAiProvider: 'ashna' | 'custom';
  sleepWindow: { start: string; end: string };
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  customAiConfig?: { endpoint: string; model: string; hasApiKey: boolean };
}

async function fetchPreferences(): Promise<PreferencesDto> {
  const { data } = await apiClient.get<{ preferences: PreferencesDto }>('/users/me/preferences');
  return data.preferences;
}

/**
 * Composition root for Settings — each concern (account, AI config,
 * scheduling behavior, security/sessions) now owns its own state and
 * mutations. This page's only job is fetching the shared `preferences`
 * object once and handing the relevant slice to each section.
 */
export function SettingsPage() {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });

  if (isLoading || !preferences) {
    return <LoadingSpinner label="Loading settings…" fullHeight />;
  }

  return (
    <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h1 style={{ color: 'var(--color-text-primary)', fontSize: '22px', margin: 0 }}>Settings</h1>

      <AccountSection />
      <AiPreferencesSection preferences={preferences} />
      <SchedulingPreferencesSection preferences={preferences} />
      <SecuritySection />
    </div>
  );
}

export default SettingsPage;