import jsPDF from 'jspdf';
import { EventDto } from '../types/shared';
import { formatEventRange } from './formatters';

const SOURCE_LABEL: Record<EventDto['source'], string> = {
  manual: '',
  'ai-ashna': '(Ashna AI)',
  'ai-custom': '(Custom AI Agent)',
};

const PAGE_MARGIN = 40;
const LINE_HEIGHT = 18;
const TITLE_FONT_SIZE = 12;
const META_FONT_SIZE = 9;

/**
 * Generates and triggers a download of a PDF agenda for the given events,
 * grouped by calendar day. Client-side generation (jsPDF) rather than a
 * backend PDF service — the data is already in the browser via
 * useEventsQuery, so a server round-trip for this would be pure overhead.
 */
export function generateAgendaPdf(events: EventDto[], rangeLabel: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = PAGE_MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CP Calendar Pro — Agenda', PAGE_MARGIN, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(rangeLabel, PAGE_MARGIN, y);
  doc.setTextColor(0);
  y += 28;

  const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (sorted.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('No events in this range.', PAGE_MARGIN, y);
    doc.save(buildFileName(rangeLabel));
    return;
  }

  const groupedByDay = new Map<string, EventDto[]>();
  for (const event of sorted) {
    const dayKey = new Date(event.startTime).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
    if (!groupedByDay.has(dayKey)) groupedByDay.set(dayKey, []);
    groupedByDay.get(dayKey)!.push(event);
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  for (const [dayLabel, dayEvents] of groupedByDay) {
    ensureSpace(LINE_HEIGHT * 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(dayLabel, PAGE_MARGIN, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 18;

    for (const event of dayEvents) {
      ensureSpace(LINE_HEIGHT * 2.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(TITLE_FONT_SIZE);
      const sourceTag = SOURCE_LABEL[event.source] ? ` ${SOURCE_LABEL[event.source]}` : '';
      doc.text(`• ${event.title}${sourceTag}`, PAGE_MARGIN + 10, y);
      y += LINE_HEIGHT;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(META_FONT_SIZE);
      doc.setTextColor(120);
      doc.text(formatEventRange(event.startTime, event.endTime), PAGE_MARGIN + 20, y);
      doc.setTextColor(0);
      y += LINE_HEIGHT;

      if (event.aiReasoning) {
        const wrapped = doc.splitTextToSize(event.aiReasoning, pageWidth - PAGE_MARGIN * 2 - 20);
        ensureSpace(wrapped.length * (LINE_HEIGHT - 4));
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(META_FONT_SIZE);
        doc.setTextColor(140);
        doc.text(wrapped, PAGE_MARGIN + 20, y);
        doc.setTextColor(0);
        y += wrapped.length * (LINE_HEIGHT - 4);
      }

      y += 8;
    }

    y += 10;
  }

  doc.save(buildFileName(rangeLabel));
}

function buildFileName(rangeLabel: string): string {
  const safe = rangeLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `cp-calendar-pro-agenda-${safe}.pdf`;
}