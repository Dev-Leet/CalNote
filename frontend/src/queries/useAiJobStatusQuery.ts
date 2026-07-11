import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { aiApi, AiJobStatusResponse } from '../api/ai.api';
 
/**
 * Polls the async AI scheduling job status endpoint with backoff, for the
 * Custom AI Agent's queued path (Section 5.2 notes: sync timeout ~20s).
 * Automatically invalidates the events list once the job completes so the
 * calendar reflects newly created events without a manual refetch.
 */
export function useAiJobStatusQuery(jobId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<AiJobStatusResponse>({
    queryKey: ['ai-job-status', jobId],
    queryFn: () => aiApi.getJobStatus(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === 'pending') return 2000;
      return false;
    },
  });

  useEffect(() => {
    if (query.data?.status === 'complete') {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  }, [query.data?.status, queryClient]);

  return query;
}
