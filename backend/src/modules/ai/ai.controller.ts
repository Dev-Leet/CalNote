import { Request, Response, NextFunction } from 'express';
import { AiProviderFactory } from './AiProviderFactory';
import { AiProviderId, SchedulingContext, CompactEvent, CompactContest } from './IAiSchedulerProvider';
import { eventService } from '../events/event.service';
import { ContestModel } from '../../models/Contest.model';
import { UserModel } from '../../models/User.model';
import { NoteModel } from '../../models/Note.model';
import { toIST, nowInIST } from '../../utils/timezone';
import { serializeEvent } from '../../utils/serializers';
import { toEventServiceInput, wrapPlainTextAsTipTapDoc, buildContestIdSet } from './normalizeForPersistence';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
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
      id: c._id.toString(),
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
    const aiCallPromise = provider_.generateSchedule(context);

    const timeoutPromise = new Promise<'TIMEOUT'>((resolve) =>
      setTimeout(() => resolve('TIMEOUT'), SYNC_TIMEOUT_MS),
    );

    const raceResult = await Promise.race([aiCallPromise, timeoutPromise]);

    if (raceResult === 'TIMEOUT') {
      // The original call is still in flight and was never awaited by the
      // caller — attach a silent catch so a late failure doesn't surface as
      // an unhandled promise rejection. Its result (success or failure) is
      // discarded; the queued job below performs its own independent call.
      // NOTE: this means a timed-out request costs two AI calls, not one —
      // acceptable for MVP, but worth revisiting if AI provider cost becomes
      // a concern (e.g. by making providers support cancellation/AbortSignal).
      aiCallPromise.catch((err) => {
        logger.warn({ err, userId }, 'Abandoned AI call (already handed off to queue) failed');
      });

      const job = await aiScheduleQueue.add('generate-schedule', {
        userId,
        provider: resolvedProvider,
        context,
      });
      res.status(202).json({ jobId: job.id, statusUrl: `/api/v1/ai/schedule/status/${job.id}` });
      return;
    }

    const normalized = raceResult;
    const validContestIds = buildContestIdSet(upcomingContestDocs);

    const createdEvents = await Promise.all(
      normalized.events.map(async (evt) => {
        const input = toEventServiceInput(evt, validContestIds);

        let noteId: string | undefined;
        if (input.rawNoteText) {
          const note = await NoteModel.create({
            userId,
            contentRichText: wrapPlainTextAsTipTapDoc(input.rawNoteText),
          });
          noteId = note._id.toString();
        }

        return eventService.createEvent({
          userId,
          title: input.title,
          startTime: input.startTime,
          endTime: input.endTime,
          source: resolvedProvider === 'ashna' ? 'ai-ashna' : 'ai-custom',
          sourceContestId: input.sourceContestId,
          recurrence: input.recurrence,
          aiReasoning: normalized.reasoning,
          noteId,
          force: true, // AI already reasons about conflicts per system instruction rules 1-3
        });
      }),
    );

    res.status(200).json({
      events: createdEvents.map(serializeEvent),
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