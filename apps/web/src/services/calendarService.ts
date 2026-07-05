// apps/web/src/services/calendarService.ts
// Calendar sync API calls

import { apiClient } from './api';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  results: Array<{ contestId: string; status: string; calendarEventId?: string }>;
}

export interface CalendarStatus {
  connected: boolean;
  syncedCount: number;
  lastSync?: string;
}

export const calendarService = {
  sync: async (contestIds?: string[]): Promise<SyncResult> => {
    const res = await apiClient.post<{ success: boolean; data: SyncResult }>('/calendar/sync', {
      contestIds,
    });
    return res.data.data;
  },

  getStatus: async (): Promise<CalendarStatus> => {
    const res = await apiClient.get<{ success: boolean; data: CalendarStatus }>('/calendar/status');
    return res.data.data;
  },
};
