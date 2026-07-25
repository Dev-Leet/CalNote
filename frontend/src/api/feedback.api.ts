import apiClient from './client';

export type FeedbackCategory = 'bug' | 'feature-request' | 'general' | 'praise';

export interface SubmitFeedbackPayload {
  category: FeedbackCategory;
  message: string;
  rating?: number;
  pageContext?: string;
}

export const feedbackApi = {
  async submit(payload: SubmitFeedbackPayload): Promise<void> {
    await apiClient.post('/feedback', payload);
  },
};