import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient, { setAccessToken } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { AuthPage } from '../pages/AuthPage';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { ContestsPage } from '../pages/ContestsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { HelpPage } from '../pages/HelpPage';

// Lazy-loaded specifically because these two pull in genuinely large
// libraries (Monaco Editor, Tiptap) that most sessions never touch —
// splitting them into their own chunks is what actually addresses Vite's
// "chunk larger than 500kB" warning, rather than just raising the warning
// threshold to hide it.
const NotesPage = lazy(() => import('../pages/NotesPage').then((m) => ({ default: m.NotesPage })));
const CodePage = lazy(() => import('../pages/CodePage').then((m) => ({ default: m.CodePage })));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<LoadingSpinner fullHeight />}>{element}</Suspense>;
}

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
        // Refresh failed — silently leave isAuthenticated false; route guards below handle it.
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

  if (!checked) return null;
  return <>{children}</>;
}

/**
 * "/" now branches on auth state rather than being one fixed page:
 * logged-out visitors see the marketing LandingPage, logged-in users are
 * sent straight to the HomePage dashboard. This is the resolution to the
 * collision Phase 6 introduced (Home moved to "/") — "/" was never meant
 * to mean two different things depending on who's asking, this makes that
 * branch explicit rather than picking one and losing the other.
 */
function RootRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

/** Prevents an already-logged-in user from seeing /auth or the landing page again. */
function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/auth', element: <AuthPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/contests', element: <ContestsPage /> },
          { path: '/notes', element: withSuspense(<NotesPage />) },
          { path: '/code', element: withSuspense(<CodePage />) },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/help', element: <HelpPage /> },
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