import { Note } from '@cp-calendar/shared';
export interface CreateNoteInput {
    contestId?: string;
    title: string;
    content: string;
    tags?: string[];
}
export interface GenerateNoteInput {
    contestId: string;
    userPrompt?: string;
    skillLevel?: string;
}
export declare const noteService: {
    getNotes: (contestId?: string) => Promise<Note[]>;
    getById: (id: string) => Promise<Note>;
    create: (input: CreateNoteInput) => Promise<Note>;
    update: (id: string, input: Partial<CreateNoteInput>) => Promise<Note>;
    delete: (id: string) => Promise<void>;
    generate: (input: GenerateNoteInput) => Promise<Note>;
};
//# sourceMappingURL=noteService.d.ts.map