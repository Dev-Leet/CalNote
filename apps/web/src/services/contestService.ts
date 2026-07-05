// apps/web/src/services/contestService.ts
// Contest API calls

import { apiClient } from './api';
import { Contest, Platform } from '@cp-calendar/shared';

export interface GetContestsParams {
  platform?: Platform;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

export interface ContestsResponse {
  success: boolean;
  contests: Contest[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const contestService = {
  getContests: async (params?: GetContestsParams): Promise<ContestsResponse> => {
    const res = await apiClient.get<ContestsResponse>('/contests', { params });
    return res.data;
  },

  getUpcoming: async (days = 30): Promise<Contest[]> => {
    const res = await apiClient.get<{ success: boolean; data: Contest[] }>('/contests/upcoming', {
      params: { days },
    });
    return res.data.data;
  },

  getToday: async (): Promise<Contest[]> => {
    const res = await apiClient.get<{ success: boolean; data: Contest[] }>('/contests/today');
    return res.data.data;
  },

  getStats: async (): Promise<{ total: number; upcoming: number; byPlatform: Record<string, number> }> => {
    const res = await apiClient.get<{ success: boolean; data: { total: number; upcoming: number; byPlatform: Record<string, number> } }>('/contests/stats');
    return res.data.data;
  },

  getById: async (id: string): Promise<Contest> => {
    const res = await apiClient.get<{ success: boolean; data: Contest }>(`/contests/${id}`);
    return res.data.data;
  },
};
