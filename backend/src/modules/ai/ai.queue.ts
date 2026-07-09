import { Queue, Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import { AiProviderFactory } from './AiProviderFactory';
import { SchedulingContext, AiProviderId, NormalizedAiEventResponse } from './IAiSchedulerProvider';
import { eventService } from '../events/event.service';
import { NoteModel } from '../../models/Note.model';
import { fromISTStringToUTCDate } from '../../utils/timezone';
import { logger } from '../../utils/logger';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export interface AiScheduleJobData {
  userId: string;
  provider: AiProviderId;
  context: SchedulingContext;
}

export const aiScheduleQueue = new Queue<AiScheduleJobData, NormalizedAiEventResponse>('ai-schedule', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 }, // keep completed jobs for 1hr so status polling can retrieve results
    removeOnFail: { age: 86400 },
  },
});

export const aiScheduleWorker = new Worker<AiScheduleJobData, NormalizedAiEventResponse>(
  'ai-schedule',
  async (job: Job<AiScheduleJobData>) => {
    const { userId, provider: providerFlag, context } = job.data;

    const provider = AiProviderFactory.resolve(providerFlag);
    const normalized = await provider.generateSchedule(context);

    // Persist events — mirrors the synchronous path in ai.controller.ts so
    // both routes converge on identical side effects, regardless of which
    // path (sync vs queued) actually handled the request.
    await Promise.all(
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
          source: providerFlag === 'ashna' ? 'ai-ashna' : 'ai-custom',
          sourceContestId: evt.sourceContestId ?? undefined,
          recurrence: evt.recurrence ?? undefined,
          aiReasoning: normalized.reasoning,
          noteId: noteId?.toString(),
          force: true,
        });
      }),
    );

    return normalized;
  },
  { connection, concurrency: 5 },
);

aiScheduleWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, userId: job.data.userId }, 'AI schedule job completed');
});

aiScheduleWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, userId: job?.data.userId, err }, 'AI schedule job failed');
});

export async function shutdownAiQueue(): Promise<void> {
  await aiScheduleWorker.close();
  await aiScheduleQueue.close();
}
