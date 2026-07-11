import { Types } from 'mongoose';
import { NormalizedAiEvent } from './IAiSchedulerProvider';
import { fromISTStringToUTCDate } from '../../utils/timezone';
import { IRecurrenceRule } from '../../models/Event.model';

export interface EventServiceCreateInput {
  title: string;
  startTime: Date;
  endTime: Date;
  recurrence?: IRecurrenceRule;
  sourceContestId?: string;
  rawNoteText?: string;
}

/**
 * Converts one AI-generated event (wire format: IST ISO strings, nullable
 * fields) into the shape EventService.createEvent actually expects (UTC
 * Date objects, undefined instead of null). Previously this conversion was
 * hand-rolled inline in ai.controller.ts and NOT replicated at all in
 * ai.queue.ts — the queue worker passed evt.recurrence straight through,
 * which fails Mongoose's Date cast, and passed evt.sourceContestId straight
 * through as a raw string into an ObjectId field, which throws a CastError.
 *
 * validContestIds should be built from the SAME upcomingContestDocs used to
 * build the AI's context — this guards against the AI hallucinating a
 * sourceContestId that doesn't correspond to a real contest in this request.
 */
export function toEventServiceInput(
  evt: NormalizedAiEvent,
  validContestIds: Set<string>,
): EventServiceCreateInput {
  const recurrence: IRecurrenceRule | undefined = evt.recurrence
    ? {
        freq: evt.recurrence.freq,
        interval: evt.recurrence.interval,
        byDay: evt.recurrence.byDay ?? undefined,
        until: evt.recurrence.until ? fromISTStringToUTCDate(evt.recurrence.until) : undefined,
      }
    : undefined;

  const sourceContestId =
    evt.sourceContestId && validContestIds.has(evt.sourceContestId) ? evt.sourceContestId : undefined;

  return {
    title: evt.title,
    startTime: fromISTStringToUTCDate(evt.startTime),
    endTime: fromISTStringToUTCDate(evt.endTime),
    recurrence,
    sourceContestId,
    rawNoteText: evt.notes ?? undefined,
  };
}

/**
 * Wraps plain AI-generated note text in a minimal valid TipTap JSON
 * document. NoteEditor.tsx does `JSON.parse(initialContent)` with no
 * fallback — passing raw prose text there throws a SyntaxError and crashes
 * the page the moment a user opens a note that originated from an AI prompt.
 */
export function wrapPlainTextAsTipTapDoc(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });
}

export function buildContestIdSet(contestDocs: { _id: Types.ObjectId }[]): Set<string> {
  return new Set(contestDocs.map((c) => c._id.toString()));
}