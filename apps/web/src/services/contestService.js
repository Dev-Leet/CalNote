// apps/web/src/services/contestService.ts
// Contest API calls
import { apiClient } from './api';
export const contestService = {
    getContests: async (params) => {
        const res = await apiClient.get('/contests', { params });
        return res.data;
    },
    getUpcoming: async (days = 30) => {
        const res = await apiClient.get('/contests/upcoming', {
            params: { days },
        });
        return res.data.data;
    },
    getToday: async () => {
        const res = await apiClient.get('/contests/today');
        return res.data.data;
    },
    getStats: async () => {
        const res = await apiClient.get('/contests/stats');
        return res.data.data;
    },
    getById: async (id) => {
        const res = await apiClient.get(`/contests/${id}`);
        return res.data.data;
    },
};
//# sourceMappingURL=contestService.js.map