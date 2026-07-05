import { Platform } from '@cp-calendar/shared';
export declare const CONTEST_KEYS: {
    all: readonly ["contests"];
    list: (params?: {
        platform?: Platform;
        upcoming?: boolean;
    }) => readonly ["contests", "list", {
        platform?: Platform;
        upcoming?: boolean;
    } | undefined];
    upcoming: (days?: number) => readonly ["contests", "upcoming", number | undefined];
    today: () => readonly ["contests", "today"];
    stats: () => readonly ["contests", "stats"];
    detail: (id: string) => readonly ["contests", "detail", string];
};
export declare function useContests(params?: {
    platform?: Platform;
    upcoming?: boolean;
    page?: number;
}): import("@tanstack/react-query").UseQueryResult<NoInfer<import("../services/contestService").ContestsResponse>, Error>;
export declare function useUpcomingContests(days?: number): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@shared/types").Contest[]>, Error>;
export declare function useTodayContests(): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@shared/types").Contest[]>, Error>;
export declare function useContestStats(): import("@tanstack/react-query").UseQueryResult<NoInfer<{
    total: number;
    upcoming: number;
    byPlatform: Record<string, number>;
}>, Error>;
export declare function useContest(id: string): import("@tanstack/react-query").UseQueryResult<NoInfer<import("@shared/types").Contest>, Error>;
//# sourceMappingURL=useContests.d.ts.map