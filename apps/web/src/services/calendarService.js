// apps/web/src/services/calendarService.ts
// Calendar sync API calls
import { apiClient } from './api';
export const calendarService = {
    sync: async (contestIds) => {
        const res = await apiClient.post('/calendar/sync', {
            contestIds,
        });
        return res.data.data;
    },
    getStatus: async () => {
        const res = await apiClient.get('/calendar/status');
        return res.data.data;
    },
};
//# sourceMappingURL=calendarService.js.map