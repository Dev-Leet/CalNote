import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { EventService } from '../../src/modules/events/event.service';
import { EventModel, IEvent } from '../../src/models/Event.model';
import { AppError } from '../../src/utils/AppError';
 
vi.mock('../../src/models/Event.model', () => ({
  EventModel: {
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService();
    vi.clearAllMocks();
  });

  describe('checkConflicts', () => {
    it('returns hasConflict: false when no overlapping events exist', async () => {
      vi.mocked(EventModel.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const userId = new Types.ObjectId().toString();
      const result = await eventService.checkConflicts(
        userId,
        new Date('2026-07-10T14:00:00Z'),
        new Date('2026-07-10T15:00:00Z'),
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingEventIds).toEqual([]);
    });

    it('detects a genuine overlap and returns the conflicting event id', async () => {
      const conflictingId = new Types.ObjectId();
      vi.mocked(EventModel.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: conflictingId,
              startTime: new Date('2026-07-10T14:30:00Z'),
              endTime: new Date('2026-07-10T15:30:00Z'),
            },
          ]),
        }),
      } as never);

      const userId = new Types.ObjectId().toString();
      const result = await eventService.checkConflicts(
        userId,
        new Date('2026-07-10T14:00:00Z'),
        new Date('2026-07-10T15:00:00Z'),
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEventIds).toEqual([conflictingId.toString()]);
    });

    it('does not flag adjacent (touching, non-overlapping) events as conflicts', async () => {
      vi.mocked(EventModel.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          // endTime === proposed startTime — a real DB query with $lt/$gt would
          // already exclude this, but we test the in-memory rangesOverlap guard too
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const userId = new Types.ObjectId().toString();
      const result = await eventService.checkConflicts(
        userId,
        new Date('2026-07-10T15:00:00Z'),
        new Date('2026-07-10T16:00:00Z'),
      );

      expect(result.hasConflict).toBe(false);
    });
  });

  describe('createEvent', () => {
    it('throws VALIDATION_ERROR when endTime is not after startTime', async () => {
      const userId = new Types.ObjectId().toString();

      await expect(
        eventService.createEvent({
          userId,
          title: 'Invalid event',
          startTime: new Date('2026-07-10T15:00:00Z'),
          endTime: new Date('2026-07-10T14:00:00Z'),
        }),
      ).rejects.toThrow(AppError);
    });

    it('throws CONFLICT_DETECTED when overlap exists and force is not set', async () => {
      const conflictingId = new Types.ObjectId();
      vi.mocked(EventModel.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: conflictingId,
              startTime: new Date('2026-07-10T14:30:00Z'),
              endTime: new Date('2026-07-10T15:30:00Z'),
            },
          ]),
        }),
      } as never);

      const userId = new Types.ObjectId().toString();

      await expect(
        eventService.createEvent({
          userId,
          title: 'Overlapping event',
          startTime: new Date('2026-07-10T14:00:00Z'),
          endTime: new Date('2026-07-10T15:00:00Z'),
        }),
      ).rejects.toThrow(AppError);
    });

    it('bypasses conflict check and creates the event when force is true', async () => {
      const userId = new Types.ObjectId().toString();
      const createdDoc = { _id: new Types.ObjectId(), title: 'Forced event' } as IEvent;
      vi.mocked(EventModel.create).mockResolvedValue(createdDoc as never);

      const result = await eventService.createEvent({
        userId,
        title: 'Forced event',
        startTime: new Date('2026-07-10T14:00:00Z'),
        endTime: new Date('2026-07-10T15:00:00Z'),
        force: true,
      });

      expect(EventModel.find).not.toHaveBeenCalled();
      expect(result).toBe(createdDoc);
    });
  });

  describe('expandRecurrence', () => {
    it('expands a weekly recurrence correctly within the given range', () => {
      const baseEvent = {
        startTime: new Date('2026-07-06T19:00:00Z'), // a Monday
        endTime: new Date('2026-07-06T21:00:00Z'),
        recurrence: {
          freq: 'weekly' as const,
          interval: 1,
          byDay: ['MO', 'WE', 'FR'],
        },
      } as IEvent;

      const occurrences = eventService.expandRecurrence(
        baseEvent,
        new Date('2026-07-06T00:00:00Z'),
        new Date('2026-07-13T00:00:00Z'),
      );

      // Expect Monday 07/06, Wednesday 07/08, Friday 07/10 within this window
      expect(occurrences.length).toBeGreaterThanOrEqual(3);
      occurrences.forEach((o) => {
        expect(o.endTime.getTime() - o.startTime.getTime()).toBe(2 * 60 * 60 * 1000);
      });
    });

    it('returns a single occurrence for a non-recurring event that overlaps the range', () => {
      const baseEvent = {
        startTime: new Date('2026-07-10T14:00:00Z'),
        endTime: new Date('2026-07-10T15:00:00Z'),
        recurrence: undefined,
      } as IEvent;

      const occurrences = eventService.expandRecurrence(
        baseEvent,
        new Date('2026-07-10T00:00:00Z'),
        new Date('2026-07-11T00:00:00Z'),
      );

      expect(occurrences).toHaveLength(1);
    });

    it('returns no occurrences for a non-recurring event outside the range', () => {
      const baseEvent = {
        startTime: new Date('2026-07-10T14:00:00Z'),
        endTime: new Date('2026-07-10T15:00:00Z'),
        recurrence: undefined,
      } as IEvent;

      const occurrences = eventService.expandRecurrence(
        baseEvent,
        new Date('2026-08-01T00:00:00Z'),
        new Date('2026-08-02T00:00:00Z'),
      );

      expect(occurrences).toHaveLength(0);
    });
  });
});
