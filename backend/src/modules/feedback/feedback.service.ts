import { Types } from 'mongoose';
import { FeedbackModel, FeedbackCategory } from '../../models/Feedback.model';

export interface SubmitFeedbackInput {
  userId: string;
  category: FeedbackCategory;
  message: string;
  rating?: number;
  pageContext?: string;
}

export class FeedbackService {
  async submit(input: SubmitFeedbackInput) {
    return FeedbackModel.create({
      userId: new Types.ObjectId(input.userId),
      category: input.category,
      message: input.message,
      rating: input.rating,
      pageContext: input.pageContext,
    });
  }
}

export const feedbackService = new FeedbackService();