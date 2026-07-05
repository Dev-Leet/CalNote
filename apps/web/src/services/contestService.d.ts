import { Contest, Platform } from '@cp-calendar/shared';
export interface GetContestsParams {
    platform?: Platform;
    upcoming?: boolean;
    page?: number;
    limit?: number;
}
export interface ContestsResponse {
    success: boolean;
    contests: Contest[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}
export declare const contestService: {
    getContests: (params?: GetContestsParams) => Promise<ContestsResponse>;
    getUpcoming: (days?: number) => Promise<Contest[]>;
    getToday: () => Promise<Contest[]>;
    getStats: () => Promise<{
        total: number;
        upcoming: number;
        byPlatform: Record<string, number>;
    }>;
    getById: (id: string) => Promise<Contest>;
};
//# sourceMappingURL=contestService.d.ts.map