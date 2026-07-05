export interface SyncResult {
    syncedCount: number;
    failedCount: number;
    results: Array<{
        contestId: string;
        status: string;
        calendarEventId?: string;
    }>;
}
export interface CalendarStatus {
    connected: boolean;
    syncedCount: number;
    lastSync?: string;
}
export declare const calendarService: {
    sync: (contestIds?: string[]) => Promise<SyncResult>;
    getStatus: () => Promise<CalendarStatus>;
};
//# sourceMappingURL=calendarService.d.ts.map