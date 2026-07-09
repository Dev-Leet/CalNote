import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AiProviderFactory } from './AiProviderFactory';
import { AiProviderId, SchedulingContext, CompactEvent, CompactContest } from './IAiSchedulerProvider';
import { eventService } from '../events/event.service';
import { ContestModel } from '../../models/Contest.model';
import { UserModel } from '../../models/User.model';
import { EventModel } from '../../models/Event.model';
import { NoteModel } from '../../models/Note.model';
import { toIST, nowInIST, fromISTStringToUTCDate } from '../../utils/timezone';
import { AppError } from '../../utils/AppError';
import { aiScheduleQueue } from './ai.queue';

const SYNC_TIMEOUT_MS = 20_000;

export async function postAiSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { prompt, provider, dateRangeHint } = req.body as {
      prompt: string;
      provider?: AiProviderId;
      dateRangeHint?: { from: string; to: string };
    };

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    const resolvedProvider: AiProviderId = provider ?? user.preferences.defaultAiProvider;

    const from = dateRangeHint?.from ? new Date(dateRangeHint.from) : new Date();
    const to = dateRangeHint?.to
      ? new Date(dateRangeHint.to)
      : new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Gather context in parallel — Section 5.2, steps G–I.
    const [existingEventDocs, upcomingContestDocs] = await Promise.all([
      eventService.getEventsInRange(userId, from, to),
      ContestModel.find({ startTime: { $gte: new Date(), $lte: to } }).sort({ startTime: 1 }).limit(50).exec(),
    ]);

    const existingEvents: CompactEvent[] = existingEventDocs.map((e) => ({
      title: e.title,
      start: toIST(e.startTime),
      end: toIST(e.endTime),
    }));

    const upcomingContests: CompactContest[] = upcomingContestDocs.map((c) => ({
      name: c.name,
      platform: c.platform,
      start: toIST(c.startTime),
      end: toIST(c.endTime),
    }));

    const context: SchedulingContext = {
      userId,
      prompt,
      currentDateTimeIST: nowInIST(),
      existingEvents,
      upcomingContests,
      preferences: {
        sleepWindow: user.preferences.sleepWindow,
        timezone: 'Asia/Kolkata',
      },
    };

    const provider_ = AiProviderFactory.resolve(resolvedProvider);

    // Race the AI call against the sync timeout threshold (NFR-1). If it's
    // still running when the timer fires, hand off to the async job queue
    // instead of blocking the HTTP response indefinitely.
    const timeoutPromise = new Promise<'TIMEOUT'>((resolve) =>
      setTimeout(() => resolve('TIMEOUT'), SYNC_TIMEOUT_MS),
    );

    const raceResult = await Promise.race([provider_.generateSchedule(context), timeoutPromise]);

    if (raceResult === 'TIMEOUT') {
      const job = await aiScheduleQueue.add('generate-schedule', {
        userId,
        provider: resolvedProvider,
        context,
      });
      res.status(202).json({ jobId: job.id, statusUrl: `/api/v1/ai/schedule/status/${job.id}` });
      return;
    }

    const normalized = raceResult;
    const contestIdMap = new Map(upcomingContestDocs.map((c) => [c.name, c._id]));

    const createdEvents = await Promise.all(
      normalized.events.map(async (evt) => {
        let noteId: Types.ObjectId | undefined;
        if (evt.notes) {
          const note = await NoteModel.create({ userId, contentRichText: evt.notes });
          noteId = note._id;
        }

        return eventService.createEvent({
          userId,
          title: evt.title,
          startTime: fromISTStringToUTCDate(evt.startTime),
          endTime: fromISTStringToUTCDate(evt.endTime),
          source: resolvedProvider === 'ashna' ? 'ai-ashna' : 'ai-custom',
          sourceContestId: evt.sourceContestId
            ? contestIdMap.get(evt.sourceContestId)?.toString()
            : undefined,
          recurrence: evt.recurrence ?? undefined,
          aiReasoning: normalized.reasoning,
          noteId: noteId?.toString(),
          force: true, // AI already reasons about conflicts per system instruction rule 1-3
        });
      }),
    );

    res.status(200).json({
      events: createdEvents,
      reasoning: normalized.reasoning,
      providerUsed: normalized.providerUsed,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAiScheduleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobId } = req.params;
    const job = await aiScheduleQueue.getJob(jobId);

    if (!job) {
      throw new AppError('NOT_FOUND', 404, 'Job not found');
    }

    const state = await job.getState();

    if (state === 'completed') {
      res.status(200).json({ status: 'complete', result: job.returnvalue });
      return;
    }
    if (state === 'failed') {
      res.status(200).json({ status: 'failed', error: job.failedReason });
      return;
    }
    res.status(200).json({ status: 'pending' });
  } catch (err) {
    next(err);
  }
}
