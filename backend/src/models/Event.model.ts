import { Schema, model, Document, Types } from 'mongoose';

export type EventSource = 'manual' | 'ai-ashna' | 'ai-custom';
export type RecurrenceFreq = 'daily' | 'weekly' | 'custom';

export interface IRecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  byDay?: string[]; // e.g. ['MO', 'TU', 'WE']
  until?: Date;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  startTime: Date; // stored in UTC; converted to IST at the API boundary only
  endTime: Date;
  source: EventSource;
  sourceContestId?: Types.ObjectId;
  recurrence?: IRecurrenceRule;
  aiReasoning?: string; // populated only when source is 'ai-ashna' | 'ai-custom'
  googleCalendarEventId?: string;
  noteId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecurrenceRuleSchema = new Schema<IRecurrenceRule>(
  {
    freq: { type: String, enum: ['daily', 'weekly', 'custom'], required: true },
    interval: { type: Number, required: true, default: 1, min: 1 },
    byDay: { type: [String], default: undefined },
    until: { type: Date, default: undefined },
  },
  { _id: false },
);

const EventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    source: {
      type: String,
      enum: ['manual', 'ai-ashna', 'ai-custom'],
      required: true,
      default: 'manual',
      index: true,
    },
    sourceContestId: { type: Schema.Types.ObjectId, ref: 'Contest', default: undefined },
    recurrence: { type: RecurrenceRuleSchema, default: undefined },
    aiReasoning: {
      type: String,
      default: undefined,
      // aiReasoning should only be present on AI-sourced events — enforced at the
      // service layer (event.service.ts), not the schema layer, to keep validation logic centralized.
    },
    googleCalendarEventId: { type: String, default: undefined, index: true, sparse: true },
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', default: undefined },
  },
  { timestamps: true },
);

// Primary access pattern: "get user's events in a date range"
EventSchema.index({ userId: 1, startTime: 1 });
// Filtering AI- vs manually-created events in the UI
EventSchema.index({ userId: 1, source: 1 });

EventSchema.pre('validate', function (next) {
  if (this.endTime <= this.startTime) {
    return next(new Error('Event endTime must be after startTime'));
  }
  if (this.aiReasoning && this.source === 'manual') {
    return next(new Error('aiReasoning cannot be set on a manual event'));
  }
  next();
});

export const EventModel = model<IEvent>('Event', EventSchema);
