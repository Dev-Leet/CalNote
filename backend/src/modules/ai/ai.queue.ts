import { Queue, Worker, Job } from 'bullmq';
import { AiProviderFactory } from './AiProviderFactory';
import { SchedulingContext, AiProviderId, NormalizedAiEventResponse } from './IAiSchedulerProvider';
import { logger } from '../../utils/logger';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

interface AiScheduleJobData {
  userId: string;
  provider: AiProviderId;
  context: SchedulingContext;
}

export const aiScheduleQueue = new Queue<AiScheduleJobData, NormalizedAiEventResponse>('ai-schedule', {
  connection,
});

export const aiScheduleWorker = new Worker<AiScheduleJobData, NormalizedAiEventResponse>(
  'ai-schedule',
  async (job: Job<AiScheduleJobData>) => {
    const provider = AiProviderFactory.resolve(job.data.provider);
    return provider.generateSchedule(job.data.context);
  },
  { connection },
);

aiScheduleWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'AI schedule job failed');
});
