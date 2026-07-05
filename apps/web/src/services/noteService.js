// apps/web/src/services/noteService.ts
// Notes API calls
import { apiClient } from './api';
export const noteService = {
    getNotes: async (contestId) => {
        const res = await apiClient.get('/notes', {
            params: contestId ? { contestId } : undefined,
        });
        return res.data.data;
    },
    getById: async (id) => {
        const res = await apiClient.get(`/notes/${id}`);
        return res.data.data;
    },
    create: async (input) => {
        const res = await apiClient.post('/notes', input);
        return res.data.data;
    },
    update: async (id, input) => {
        const res = await apiClient.put(`/notes/${id}`, input);
        return res.data.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/notes/${id}`);
    },
    generate: async (input) => {
        const res = await apiClient.post('/notes/generate', input);
        return res.data.data;
    },
};
//# sourceMappingURL=noteService.js.map