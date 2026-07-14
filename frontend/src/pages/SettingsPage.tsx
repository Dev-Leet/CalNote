import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { AccountSection } from '../components/settings/AccountSection';
import { AiPreferencesSection } from '../components/settings/AiPreferencesSection';
import { SchedulingPreferencesSection } from '../components/settings/SchedulingPreferencesSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { UserPreferencesDto } from '../types/shared';

async function fetchPreferences(): Promise<UserPreferencesDto> {
  const { data } = await apiClient.get<{ preferences: UserPreferencesDto }>('/users/me/preferences');
  return data.preferences;
}

export function SettingsPage() {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });

  if (isLoading || !preferences) {
    return <LoadingSpinner label="Loading settings…" fullHeight />;
  }

  return (
    <div className="flex max-w-[520px] flex-col gap-8">
      <h1 className="m-0 text-2xl text-text-primary">Settings</h1>

      <AccountSection />
      <AiPreferencesSection preferences={preferences} />
      <SchedulingPreferencesSection preferences={preferences} />
      <SecuritySection />
    </div>
  );
}

export default SettingsPage;