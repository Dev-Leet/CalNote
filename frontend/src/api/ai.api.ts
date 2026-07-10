import apiClient from './client';
import { NormalizedAiEventResponse } from '../queries/useAiScheduleMutation';

export interface AiScheduleRequestPayload {
  prompt: string;
  provider: 'ashna' | 'custom';
  dateRangeHint?: { from: string; to: string };
}

export interface AiJobAcceptedResponse {
  jobId: string;
  statusUrl: string;
}

export type AiJobStatus = 'pending' | 'complete' | 'failed';

export interface AiJobStatusResponse {
  status: AiJobStatus;
  result?: NormalizedAiEventResponse;
  error?: string;
}

export const aiApi = {
  async requestSchedule(
    payload: AiScheduleRequestPayload,
  ): Promise<{ status: 202; data: AiJobAcceptedResponse } | { status: 200; data: NormalizedAiEventResponse }> {
    const response = await apiClient.post<NormalizedAiEventResponse | AiJobAcceptedResponse>('/ai/schedule', payload);

    if (response.status === 202) {
      return { status: 202, data: response.data as AiJobAcceptedResponse };
    }
    return { status: 200, data: response.data as NormalizedAiEventResponse };
  },

  async getJobStatus(jobId: string): Promise<AiJobStatusResponse> {
    const { data } = await apiClient.get<AiJobStatusResponse>(`/ai/schedule/status/${jobId}`);
    return data;
  },
};
