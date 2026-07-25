import { useState } from 'react';
import { CalendarGrid, CalendarEventVM } from '../components/calendar/CalendarGrid';
import { AiChatPanel } from '../components/ai/AiChatPanel';
import { GoogleCalendarPreview } from '../components/calendar/GoogleCalendarPreview';
import { EventDetailsPanel } from '../components/calendar/EventDetailsPanel';
import { ConflictWarningModal } from '../components/calendar/ConflictWarningModal';
import { ExportAgendaButton } from '../components/calendar/ExportAgendaButton';
import { useCreateEventWithConflictCheck } from '../hooks/useCreateEventWithConflictCheck';
import { SlotInfo } from 'react-big-calendar';

export function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventVM | null>(null);
  const {
    attemptCreate,
    isModalOpen,
    conflicts,
    isAdjusting,
    adjustError,
    cancel,
    allowOverlap,
    adjustSchedule,
  } = useCreateEventWithConflictCheck();

  const handleSelectEvent = (event: CalendarEventVM) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    const title = window.prompt('Event title:');
    if (!title?.trim()) return;
    attemptCreate({
      title: title.trim(),
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-3" style={{ minHeight: '480px' }}>
        <ExportAgendaButton />
        <div className="min-h-0 flex-1">
          <CalendarGrid onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot} />
        </div>
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

      <ConflictWarningModal
        isOpen={isModalOpen}
        conflicts={conflicts}
        onCancel={cancel}
        onProceedAnyway={allowOverlap}
        onAdjustSchedule={adjustSchedule}
        isAdjusting={isAdjusting}
      />
      {adjustError && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-warning px-4 py-2 text-xs font-semibold text-bg-primary">
          {adjustError}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;