import apiClient from './client';

export interface ExtractedScheduleItem {
  day: string;
  event: string;
  attendance: string;
  dress_code: string;
  time: string;
  location: string;
  notes: string;
}

export const extractionApi = {
  async extractSchedule(text: string): Promise<{ items: ExtractedScheduleItem[]; providerUsed: 'ashna' | 'custom' }> {
    const { data } = await apiClient.post<{ items: ExtractedScheduleItem[]; providerUsed: 'ashna' | 'custom' }>(
      '/ai/extract-schedule',
      { text },
    );
    return data;
  },
};