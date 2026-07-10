import apiClient from './client';
import { ContestDto } from '../types/shared';

export interface ContestFilters {
  platform?: string;
  from?: string;
  to?: string;
}

export const contestsApi = {
  async list(filters: ContestFilters = {}): Promise<ContestDto[]> {
    const { data } = await apiClient.get<{ contests: ContestDto[] }>('/contests', { params: filters });
    return data.contests;
  },

  async getById(contestId: string): Promise<ContestDto> {
    const { data } = await apiClient.get<{ contest: ContestDto }>(`/contests/${contestId}`);
    return data.contest;
  },

  async triggerRefresh(): Promise<void> {
    await apiClient.post('/contests/refresh');
  },
};
