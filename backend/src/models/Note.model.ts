import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  eventId?: Types.ObjectId;   // null if standalone
  contentRichText: string;    // serialized rich-text (TipTap JSON, stringified)
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', default: undefined },
    contentRichText: { type: String, required: true },
  },
  { timestamps: true },
);

// Fast lookup of notes attached to a given event
NoteSchema.index({ eventId: 1 }, { sparse: true });
// Standalone notes list, sorted recent-first
NoteSchema.index({ userId: 1, updatedAt: -1 });

export const NoteModel = model<INote>('Note', NoteSchema);
