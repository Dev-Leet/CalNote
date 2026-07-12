import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient, { setAccessToken } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { AuthPage } from '../pages/AuthPage';
import { CalendarPage } from '../pages/CalendarPage';
import { ContestsPage } from '../pages/ContestsPage';
import { NotesPage } from '../pages/NotesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { CodePage } from '../pages/CodePage';

/**
 * Attempts silent session restoration via the httpOnly refresh cookie on app
 * load, before rendering protected routes — avoids a flash of "logged out"
 * state for users with a valid, unexpired refresh token.
 */
function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;

    async function tryRestore() {
      if (!user) {
        setChecked(true);
        return;
      }
      try {
        const { data } = await apiClient.post('/auth/refresh', {}, { withCredentials: true });
        if (!cancelled) {
          setAccessToken(data.accessToken);
          setSession(user, data.accessToken);
        }
      } catch {
        // Refresh failed — user will be redirected by ProtectedRoute on next nav.
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    tryRestore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null; // could render a splash/loading screen here
  return <>{children}</>;
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/calendar" replace /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/contests', element: <ContestsPage /> },
          { path: '/notes', element: <NotesPage /> },
          { path: '/code', element: <CodePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return (
    <SessionBootstrap>
      <RouterProvider router={router} />
    </SessionBootstrap>
  );
}

export default AppRouter;
