import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAiProviderStore } from '../stores/aiProviderStore';

export interface NormalizedRecurrence {
  freq: 'daily' | 'weekly' | 'custom';
  interval: number;
  byDay?: string[];
  until?: string | null;
}

export interface NormalizedAiEvent {
  title: string;
  startTime: string;
  endTime: string;
  recurrence?: NormalizedRecurrence | null;
  notes?: string | null;
  sourceContestId?: string | null;
}

export interface NormalizedAiEventResponse {
  events: NormalizedAiEvent[];
  reasoning: string;
  providerUsed: 'ashna' | 'custom';
}

export interface AiJobAcceptedResponse {
  jobId: string;
  statusUrl: string;
}

export interface AiScheduleRequest {
  prompt: string;
  dateRangeHint?: { from: string; to: string };
}

type AiScheduleResult =
  | { status: 'complete'; data: NormalizedAiEventResponse }
  | { status: 'pending'; jobId: string };

async function submitAiSchedule(req: AiScheduleRequest, provider: 'ashna' | 'custom'): Promise<AiScheduleResult> {
  const response = await apiClient.post<NormalizedAiEventResponse | AiJobAcceptedResponse>(
    '/ai/schedule',
    { ...req, provider },
  );

  if (response.status === 202) {
    const accepted = response.data as AiJobAcceptedResponse;
    return { status: 'pending', jobId: accepted.jobId };
  }

  return { status: 'complete', data: response.data as NormalizedAiEventResponse };
}

/**
 * TanStack Query mutation hook for the AI scheduling flow. Reads the active
 * provider from aiProviderStore automatically — callers never need to pass
 * provider explicitly, keeping the toggle state as the single source of truth.
 */
export function useAiScheduleMutation() {
  const queryClient = useQueryClient();
  const provider = useAiProviderStore((state) => state.provider);

  return useMutation<AiScheduleResult, Error, AiScheduleRequest>({
    mutationFn: (req) => submitAiSchedule(req, provider),
    onSuccess: (result) => {
      if (result.status === 'complete') {
        // Invalidate the events list so the calendar reflects the new AI-scheduled events.
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
      // For 'pending' results, the caller is responsible for polling
      // useAiJobStatusQuery(jobId) and invalidating ['events'] on completion.
    },
  });
}
