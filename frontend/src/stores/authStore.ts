import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
}

/**
 * Holds the current user + access token. The access token is intentionally
 * kept in memory-backed Zustand state rather than persisted raw to localStorage
 * (short-lived, 15-min TTL — persisting it provides little benefit and adds
 * XSS exposure surface). Only the non-sensitive `user` profile is persisted,
 * so the UI can render "logged in as X" immediately on reload while the
 * actual session is re-established via the httpOnly refresh cookie + /auth/refresh.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      clearSession: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'cp-calendar-pro:auth-user',
      version: 1,
      partialize: (state) => ({ user: state.user }), // never persist accessToken
    },
  ),
);
