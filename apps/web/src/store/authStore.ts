// apps/web/src/store/authStore.ts
// Zustand store for authentication state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@cp-calendar/shared';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        // Set token in axios defaults
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete apiClient.defaults.headers.common['Authorization'];
      },

      initializeAuth: async () => {
        const { token } = get();
        if (!token) return;

        // Restore token in axios
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          await get().fetchUser();
        } catch {
          // Token expired or invalid
          get().logout();
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
          throw new Error('Failed to fetch user');
        }
      },
    }),
    {
      name: 'cp-calendar-auth',
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
