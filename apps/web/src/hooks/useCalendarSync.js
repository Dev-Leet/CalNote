// apps/web/src/hooks/useCalendarSync.ts
// Hook for calendar sync operations
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../services/calendarService';
import { toast } from 'sonner';
export function useCalendarStatus() {
    return useQuery({
        queryKey: ['calendar', 'status'],
        queryFn: calendarService.getStatus,
        staleTime: 30 * 1000, // 30 seconds
    });
}
export function useSyncContests() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (contestIds) => calendarService.sync(contestIds),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            toast.success(`Synced ${data.syncedCount} contests to Google Calendar!`);
            if (data.failedCount > 0) {
                toast.warning(`${data.failedCount} contests failed to sync`);
            }
        },
        onError: (error) => {
            console.error('Sync error:', error);
            toast.error('Failed to sync with Google Calendar');
        },
    });
}
//# sourceMappingURL=useCalendarSync.js.map