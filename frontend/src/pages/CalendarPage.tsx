import { useState } from 'react';
import { CalendarGrid, CalendarEventVM } from '../components/calendar/CalendarGrid';
import { AiChatPanel } from '../components/ai/AiChatPanel';
import { GoogleCalendarPreview } from '../components/calendar/GoogleCalendarPreview';
import { EventDetailsPanel } from '../components/calendar/EventDetailsPanel';
import { SlotInfo } from 'react-big-calendar';

export function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventVM | null>(null);

  const handleSelectEvent = (event: CalendarEventVM) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (_slot: SlotInfo) => {
    // Hook up to a "create manual event" modal here if desired.
  };

  return (
    <div className="grid h-full grid-cols-[1fr_360px] gap-5">
      <div className="min-w-0">
        <CalendarGrid onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot} />
      </div>

      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="max-h-60 flex-none overflow-y-auto rounded-lg bg-bg-surface p-3.5">
          <h3 className="mb-2.5 text-[13px] font-semibold text-text-primary">My Google Calendar</h3>
          <GoogleCalendarPreview />
        </div>

        <div className="max-h-[420px] flex-none overflow-y-auto">
          <EventDetailsPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>

        <div className="min-h-0 flex-1">
          <AiChatPanel />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;