import { useState } from 'react';
import { CalendarGrid, CalendarEventVM } from '../components/calendar/CalendarGrid';
import { AiChatPanel } from '../components/ai/AiChatPanel';
import { GoogleCalendarPreview } from '../components/calendar/GoogleCalendarPreview';
import { EventDetailsPanel } from '../components/calendar/EventDetailsPanel';
import { ConflictWarningModal } from '../components/calendar/ConflictWarningModal';
import { ExportAgendaButton } from '../components/calendar/ExportAgendaButton';
import { PushToGoogleButton } from '../components/calendar/PushToGoogleButton';
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
    // h-full is now DESKTOP-ONLY (md:h-full). On mobile the container has
    // no fixed height at all, so its stacked children (calendar block,
    // then sidebar block) are free to take their natural, bounded heights
    // and the PAGE itself scrolls past them (via AppShell's <main
    // overflow-auto>) — this is what actually fixes "the calendar feels
    // fixed while the page won't move": there's no longer a viewport-height
    // ceiling forcing the calendar's own internal scroll areas to absorb
    // touch gestures meant for the page.
    <div className="grid grid-cols-1 gap-5 md:h-full md:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ExportAgendaButton />
          <PushToGoogleButton />
        </div>
        {/*
          Calendar's own height is now an explicit, BOUNDED value on mobile
          (65vh — roughly two-thirds of the visible screen, leaving room to
          see there's more content below) rather than a bare minHeight
          floor with no ceiling. This gives react-big-calendar's own
          internal scrolling (hour grid in Week/Day view, row overflow in
          Month view) a predictable box to work within, while the PAGE
          scrolls normally to reach the sidebar/chat section beneath it.
          Desktop reverts to filling the full split-column height exactly
          as before.
        */}
        <div className="h-[65vh] md:h-auto md:min-h-0 md:flex-1">
          <CalendarGrid onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot} />
        </div>
      </div>

      {/*
        Sidebar restructured to fix two related bugs:
        1. "AI chat window changes size" — it previously sat in a flex-1
           div, so its height was whatever was LEFT OVER after the Google
           preview + event-details panels (which genuinely change height
           based on content — an empty "no event selected" state vs. a
           real event with aiReasoning text). Now the chat panel gets a
           fixed height (400px desktop / 320px mobile) that never depends
           on its siblings' content.
        2. "Chat disappears on mobile" — on the single-column mobile stack,
           a flex-1 child with no bounded ancestor height can collapse to
           near-zero. A fixed height guarantees it always renders at a
           real, usable size regardless of viewport or sibling content.
        The whole sidebar column now scrolls internally (overflow-y-auto)
        if Google preview + event details + chat together exceed the
        available vertical space, rather than any one panel fighting the
        others for room.
      */}
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
        <div className="max-h-60 flex-none overflow-y-auto rounded-lg bg-bg-surface p-3.5">
          <h3 className="mb-2.5 text-[13px] font-semibold text-text-primary">My Google Calendar</h3>
          <GoogleCalendarPreview />
        </div>

        <div className="max-h-[420px] flex-none overflow-y-auto">
          <EventDetailsPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>

        <div className="h-[320px] flex-none md:h-[400px]">
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