import jsPDF from 'jspdf';
import { EventDto } from '../types/shared';
import { formatEventRange, formatISTDate, formatISTTime } from './formatters';

const PAGE_MARGIN = 40;
const LINE_HEIGHT = 18;
const TITLE_FONT_SIZE = 12;
const META_FONT_SIZE = 9;

const SOURCE_DISPLAY: Record<EventDto['source'], string> = {
  manual: 'Manual',
  'ai-ashna': 'Ashna AI',
  'ai-custom': 'Custom AI Agent',
  // GoogleCalendarEventSummary-derived rows never pass through this map —
  // see buildTableRows below, which assigns 'Google Calendar' directly
  // for that source type instead of extending EventDto's source union.
};

/**
 * Generates and triggers a download of a PDF agenda for the given events,
 * grouped by calendar day, followed by a full flat table of the same data
 * — mirroring the two views the app itself offers (the day-grouped
 * calendar view, and a scannable list). Client-side generation (jsPDF)
 * rather than a backend PDF service.
 */
export function generateAgendaPdf(events: EventDto[], rangeLabel: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = PAGE_MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

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

  // --- Section 1: day-grouped narrative agenda (unchanged structure from before) ---
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
      doc.text(`• ${event.title}`, PAGE_MARGIN + 10, y);
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

  // --- Section 2: full flat agenda table, new per explicit request ---
  doc.addPage();
  y = PAGE_MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Agenda Table', PAGE_MARGIN, y);
  y += 28;

  const columns = [
    { label: 'Date', width: 70 },
    { label: 'Time', width: 100 },
    { label: 'Title', width: 190 },
    { label: 'Source', width: 95 },
  ];
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = 20;

  const drawTableHeader = () => {
    doc.setFillColor(230, 230, 235);
    doc.rect(PAGE_MARGIN, y - 14, tableWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(META_FONT_SIZE);
    doc.setTextColor(30);
    let x = PAGE_MARGIN + 6;
    for (const col of columns) {
      doc.text(col.label, x, y);
      x += col.width;
    }
    doc.setTextColor(0);
    y += rowHeight;
  };

  drawTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(META_FONT_SIZE);

  for (const event of sorted) {
    if (y + rowHeight > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN + 14;
      drawTableHeader();
    }

    let x = PAGE_MARGIN + 6;
    doc.setTextColor(0);
    doc.text(formatISTDate(event.startTime), x, y);
    x += columns[0].width;

    doc.text(`${formatISTTime(event.startTime)}–${formatISTTime(event.endTime)}`, x, y);
    x += columns[1].width;

    const titleLines = doc.splitTextToSize(event.title, columns[2].width - 6);
    doc.text(titleLines[0] ?? '', x, y); // single-line in the table; full title is in Section 1 above
    x += columns[2].width;

    doc.setTextColor(90);
    doc.text(SOURCE_DISPLAY[event.source], x, y);
    doc.setTextColor(0);

    y += rowHeight;
    doc.setDrawColor(235);
    doc.line(PAGE_MARGIN, y - 14, PAGE_MARGIN + tableWidth, y - 14);
  }

  doc.save(buildFileName(rangeLabel));
}

function buildFileName(rangeLabel: string): string {
  const safe = rangeLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `cp-calendar-pro-agenda-${safe}.pdf`;
}