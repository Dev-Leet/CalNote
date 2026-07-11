import { Queue, Worker, Job } from 'bullmq';
import { AiProviderFactory } from './AiProviderFactory';
import { SchedulingContext, AiProviderId, NormalizedAiEventResponse } from './IAiSchedulerProvider';
import { eventService } from '../events/event.service';
import { NoteModel } from '../../models/Note.model';
import { toEventServiceInput, wrapPlainTextAsTipTapDoc } from './normalizeForPersistence';
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
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const aiScheduleWorker = new Worker<AiScheduleJobData, NormalizedAiEventResponse>(
  'ai-schedule',
  async (job: Job<AiScheduleJobData>) => {
    const { userId, provider: providerFlag, context } = job.data;

    const provider = AiProviderFactory.resolve(providerFlag);
    const normalized = await provider.generateSchedule(context);

    // Re-derive the valid contest ID set from the SAME contest ids present
    // in the job's original context, rather than re-querying MongoDB —
    // context.upcomingContests already carries `id` per each CompactContest
    // (Fix Group B), so no extra DB round-trip is needed here.
    const validContestIds = new Set(context.upcomingContests.map((c) => c.id));

    await Promise.all(
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
          source: providerFlag === 'ashna' ? 'ai-ashna' : 'ai-custom',
          sourceContestId: input.sourceContestId,
          recurrence: input.recurrence,
          aiReasoning: normalized.reasoning,
          noteId,
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