// apps/web/src/store/authStore.ts
// Zustand store for authentication state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/api';
export const useAuthStore = create()(persist((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    setToken: (token) => {
        set({ token, isAuthenticated: true });
        // Set token in axios defaults
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    setUser: (user) => {
        set({ user });
    },
    logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete apiClient.defaults.headers.common['Authorization'];
    },
    initializeAuth: async () => {
        const { token } = get();
        if (!token)
            return;
        // Restore token in axios
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            await get().fetchUser();
        }
        catch {
            // Token expired or invalid
            get().logout();
        }
    },
    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const response = await apiClient.get('/auth/me');
            set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        }
        catch {
            set({ isLoading: false });
            throw new Error('Failed to fetch user');
        }
    },
}), {
    name: 'cp-calendar-auth',
    partialize: (state) => ({ token: state.token }), // Only persist token
}));
//# sourceMappingURL=authStore.js.map