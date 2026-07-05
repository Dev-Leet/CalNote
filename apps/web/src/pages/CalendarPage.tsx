// apps/web/src/pages/CalendarPage.tsx
// FullCalendar view showing all upcoming contests

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { useUpcomingContests } from '../hooks/useContests';
import { Platform, PLATFORM_INFO } from '@cp-calendar/shared';
import { useSyncContests } from '../hooks/useCalendarSync';
import { toast } from 'sonner';
import { Calendar, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.LEETCODE]: '#FFA116',
  [Platform.CODEFORCES]: '#1F8ACB',
  [Platform.CODECHEF]: '#B17A2F',
};

interface SelectedEvent {
  id: string;
  title: string;
  platform: Platform;
  url: string;
  start: string;
  end: string;
  duration: number;
}

export default function CalendarPage() {
  const { data: contests = [], isLoading } = useUpcomingContests(60);
  const { mutate: sync, isPending: isSyncing } = useSyncContests();
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const events = contests.map((c) => ({
    id: c.id,
    title: `${PLATFORM_INFO[c.platform].logo} ${c.name}`,
    start: c.startTime,
    end: c.endTime,
    backgroundColor: PLATFORM_COLORS[c.platform] + '30',
    borderColor: PLATFORM_COLORS[c.platform],
    textColor: '#f9fafb',
    extendedProps: {
      platform: c.platform,
      url: c.url,
      duration: c.duration,
    },
  }));

  const handleEventClick = (info: EventClickArg) => {
    setSelected({
      id: info.event.id,
      title: info.event.title,
      platform: info.event.extendedProps.platform as Platform,
      url: info.event.extendedProps.url as string,
      start: info.event.startStr,
      end: info.event.endStr,
      duration: info.event.extendedProps.duration as number,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
            <div key={p} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {PLATFORM_INFO[p as Platform].name}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            sync(undefined);
            toast.info('Syncing all contests...');
          }}
          disabled={isSyncing}
          className="btn-primary text-sm"
        >
          <Calendar size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      {/* Calendar */}
      <div className="glass-card !p-5 overflow-hidden">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-gray-500">Loading calendar...</p>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkText={(n) => `+${n} more`}
            nowIndicator
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: 'short' }}
          />
        )}
      </div>

      {/* Selected event detail panel */}
      {selected && (
        <div className="glass-card animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge-${selected.platform.toLowerCase()} px-2 py-0.5 rounded-md text-xs font-semibold`}>
                  {PLATFORM_INFO[selected.platform].logo} {PLATFORM_INFO[selected.platform].name}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{selected.title.replace(/^[^\s]+\s/, '')}</h3>
              <p className="text-sm text-gray-400">
                {new Date(selected.start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST
              </p>
              <p className="text-sm text-gray-500 mt-1">Duration: {Math.floor(selected.duration / 60)}h {selected.duration % 60}m</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-3 py-2"
              >
                <ExternalLink size={13} />
                Open
              </a>
              <button
                onClick={() => {
                  sync([selected.id]);
                  setSelected(null);
                }}
                className="btn-primary text-xs px-3 py-2"
                disabled={isSyncing}
              >
                <Calendar size={13} />
                Sync
              </button>
              <button onClick={() => setSelected(null)} className="btn-ghost px-2 py-2">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
