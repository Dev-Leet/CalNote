import { Schema, model, Document, Types } from 'mongoose';

export type ContestPlatform = 'codeforces' | 'leetcode' | 'codechef' | 'atcoder' | string;

export interface IContest extends Document {
  _id: Types.ObjectId;
  platform: ContestPlatform;
  externalId: string; // platform's native contest ID
  name: string;
  startTime: Date; // UTC
  endTime: Date;   // UTC
  url: string;
  durationMinutes: number;
  fetchedAt: Date;
  lastSyncedAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    platform: { type: String, required: true, index: true },
    externalId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    url: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    fetchedAt: { type: Date, required: true, default: Date.now },
    lastSyncedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

// Dedup key: same platform + externalId is always the same contest (upsert target)
ContestSchema.index({ platform: 1, externalId: 1 }, { unique: true });
// Range queries for "upcoming contests" + AI context fetch
ContestSchema.index({ startTime: 1 });

export const ContestModel = model<IContest>('Contest', ContestSchema);
