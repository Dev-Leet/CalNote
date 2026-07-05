export declare const NOTE_KEYS: {
    all: readonly ["notes"];
    list: (contestId?: string) => readonly ["notes", "list", string | undefined];
    detail: (id: string) => readonly ["notes", "detail", string];
};
export declare function useNotes(contestId?: string): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@shared/types").Note[]>, Error>;
export declare function useNote(id: string): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@shared/types").Note>, Error>;
export declare function useCreateNote(): import("@tanstack/react-query").UseMutationResult<import("@shared/types").Note, Error, import("../services/noteService").CreateNoteInput, unknown>;
export declare function useUpdateNote(): import("@tanstack/react-query").UseMutationResult<import("@shared/types").Note, Error, {
    id: string;
    title?: string;
    content?: string;
    tags?: string[];
}, unknown>;
export declare function useDeleteNote(): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
export declare function useGenerateNote(): import("@tanstack/react-query").UseMutationResult<import("@shared/types").Note, Error, import("../services/noteService").GenerateNoteInput, unknown>;
//# sourceMappingURL=useNotes.d.ts.map