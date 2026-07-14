import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDashboardSummaryQuery } from '../queries/useDashboardSummaryQuery';
import { UpcomingEventsCard } from '../components/dashboard/UpcomingEventsCard';
import { RecentNotesCard } from '../components/dashboard/RecentNotesCard';
import { AiChatLaunchCard } from '../components/dashboard/AiChatLaunchCard';
import { CodeLaunchCard } from '../components/dashboard/CodeLaunchCard';

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useDashboardSummaryQuery();

  const greetingName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <h1 className="m-0 text-2xl text-text-primary">Welcome back, {greetingName}</h1>
        <p className="mt-1 text-sm text-text-secondary">Here's what's happening across your workspace.</p>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-5 overflow-y-auto">
        <UpcomingEventsCard events={data?.upcomingEvents ?? []} isLoading={isLoading} />
        <CodeLaunchCard />
        <AiChatLaunchCard />
        <RecentNotesCard notes={data?.recentNotes ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default HomePage;