import { useState } from 'react';
import { CalendarGrid, CalendarEventVM } from '../components/calendar/CalendarGrid';
import { AiChatPanel } from '../components/ai/AiChatPanel';
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', height: '100%' }}>
      <div style={{ minWidth: 0 }}>
        <CalendarGrid onSelectEvent={handleSelectEvent} onSelectSlot={handleSelectSlot} />
      </div>

      <div style={{ height: '100%' }}>
        <AiChatPanel />
      </div>

      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11, 15, 25, 0.6)',
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '400px',
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--color-bg-surface)',
            }}
          >
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '18px', marginTop: 0 }}>
              {selectedEvent.title}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {selectedEvent.start.toLocaleString('en-IN')} &ndash; {selectedEvent.end.toLocaleString('en-IN')}
            </p>
            {selectedEvent.aiReasoning && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                {selectedEvent.aiReasoning}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: 'none',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
