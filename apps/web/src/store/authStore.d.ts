import { User } from '@cp-calendar/shared';
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    initializeAuth: () => Promise<void>;
    fetchUser: () => Promise<void>;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, {
            token: string | null;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, {
            token: string | null;
        }>>;
    };
}>;
export {};
//# sourceMappingURL=authStore.d.ts.map