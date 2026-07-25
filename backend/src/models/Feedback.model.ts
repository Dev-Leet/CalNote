import { Schema, model, Document, Types } from 'mongoose';

export type FeedbackCategory = 'bug' | 'feature-request' | 'general' | 'praise';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category: FeedbackCategory;
  message: string;
  rating?: number; // 1-5, optional
  pageContext?: string; // which page the user was on when submitting, for debugging context
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: ['bug', 'feature-request', 'general', 'praise'], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5 },
    pageContext: { type: String, maxlength: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FeedbackSchema.index({ createdAt: -1 });

export const FeedbackModel = model<IFeedback>('Feedback', FeedbackSchema);