// apps/web/src/App.tsx
// Root application component with routing

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<HomePage />} />

        {/* OAuth callback handler */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* App pages inside shared layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster
        position="top-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(26, 31, 58, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f9fafb',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </Router>
  );
}

export default App;
