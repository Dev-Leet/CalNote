// apps/web/src/pages/DashboardPage.tsx
// Main dashboard showing upcoming contests with filters and stats

import { useState } from 'react';
import { BarChart3, Calendar, Code2, Clock, Filter } from 'lucide-react';
import { useUpcomingContests, useContestStats } from '../hooks/useContests';
import { Platform } from '@cp-calendar/shared';
import ContestCard from '../components/contest/ContestCard';
import { useSyncContests } from '../hooks/useCalendarSync';

const PLATFORM_FILTERS: Array<{ label: string; value: Platform | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'LeetCode', value: Platform.LEETCODE },
  { label: 'Codeforces', value: Platform.CODEFORCES },
  { label: 'CodeChef', value: Platform.CODECHEF },
];

const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.LEETCODE]: '#FFA116',
  [Platform.CODEFORCES]: '#1F8ACB',
  [Platform.CODECHEF]: '#B17A2F',
};

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<Platform | 'ALL'>('ALL');
  const { data: contests = [], isLoading, isError } = useUpcomingContests(30);
  const { data: stats } = useContestStats();
  const { mutate: syncAll, isPending: isSyncing } = useSyncContests();

  const filtered = activeFilter === 'ALL'
    ? contests
    : contests.filter((c) => c.platform === activeFilter);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Upcoming Contests',
            value: stats?.upcoming ?? '—',
            icon: Calendar,
            color: '#6366f1',
          },
          {
            label: 'LeetCode',
            value: stats?.byPlatform?.['LEETCODE'] ?? '—',
            icon: Code2,
            color: '#FFA116',
          },
          {
            label: 'Codeforces',
            value: stats?.byPlatform?.['CODEFORCES'] ?? '—',
            icon: BarChart3,
            color: '#1F8ACB',
          },
          {
            label: 'CodeChef',
            value: stats?.byPlatform?.['CODECHEF'] ?? '—',
            icon: Clock,
            color: '#B17A2F',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card !py-4 !px-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Filter size={14} className="text-gray-500 mx-2" />
          {PLATFORM_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === value
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={
                activeFilter === value
                  ? {
                      background: value === 'ALL'
                        ? 'rgba(99,102,241,0.3)'
                        : `${PLATFORM_COLORS[value as Platform]}28`,
                      color: value === 'ALL' ? '#a5b4fc' : PLATFORM_COLORS[value as Platform],
                    }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => syncAll(undefined)}
          disabled={isSyncing}
          className="btn-primary text-sm"
        >
          <Calendar size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync All to Calendar'}
        </button>
      </div>

      {/* Contest list */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-28 animate-pulse">
              <div className="h-3 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="glass-card text-center py-12">
          <p className="text-red-400 font-medium mb-2">Failed to load contests</p>
          <p className="text-gray-500 text-sm">Please check your connection and try again.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="glass-card text-center py-16">
          <Calendar size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 font-semibold mb-1">No upcoming contests</p>
          <p className="text-gray-500 text-sm">
            {activeFilter !== 'ALL'
              ? `No contests found for ${activeFilter}. Try another platform filter.`
              : 'Check back later — contests are refreshed every 6 hours.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Showing <span className="text-primary-300 font-medium">{filtered.length}</span> upcoming contests
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
