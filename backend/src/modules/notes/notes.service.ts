import { Types } from 'mongoose';
import { NoteModel, INote } from '../../models/Note.model';
import { EventModel } from '../../models/Event.model';
import { AppError } from '../../utils/AppError';

export interface CreateNoteInput {
  userId: string;
  contentRichText: string;
  eventId?: string;
}

export interface UpdateNoteInput {
  contentRichText: string;
}

export class NotesService {
  async createNote(input: CreateNoteInput): Promise<INote> {
    if (input.eventId) {
      const event = await EventModel.findById(input.eventId).select('userId noteId').lean();
      if (!event) {
        throw new AppError('NOT_FOUND', 404, 'Linked event not found');
      }
      if (event.userId.toString() !== input.userId) {
        throw new AppError('NOT_OWNER', 403, 'You do not own the linked event');
      }
    }

    const note = await NoteModel.create({
      userId: new Types.ObjectId(input.userId),
      eventId: input.eventId ? new Types.ObjectId(input.eventId) : undefined,
      contentRichText: input.contentRichText,
    });

    if (input.eventId) {
      await EventModel.updateOne({ _id: input.eventId }, { $set: { noteId: note._id } });
    }

    return note;
  }

  async getNotes(userId: string, eventId?: string): Promise<INote[]> {
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (eventId) query.eventId = new Types.ObjectId(eventId);

    return NoteModel.find(query).sort({ updatedAt: -1 }).exec();
  }

  async getNoteById(userId: string, noteId: string): Promise<INote> {
    const note = await NoteModel.findById(noteId);
    if (!note) throw new AppError('NOT_FOUND', 404, 'Note not found');
    if (note.userId.toString() !== userId) throw new AppError('NOT_OWNER', 403, 'You do not own this note');
    return note;
  }

  async updateNote(userId: string, noteId: string, input: UpdateNoteInput): Promise<INote> {
    const note = await this.getNoteById(userId, noteId);
    note.contentRichText = input.contentRichText;
    await note.save();
    return note;
  }

  async deleteNote(userId: string, noteId: string, cascade = false): Promise<void> {
    const note = await this.getNoteById(userId, noteId);

    if (cascade && note.eventId) {
      await EventModel.updateOne({ _id: note.eventId }, { $unset: { noteId: '' } });
    }

    await note.deleteOne();
  }
}

export const notesService = new NotesService();
