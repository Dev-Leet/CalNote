import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { NavRail } from './NavRail';
import { ThemeToggle } from '../common/ThemeToggle';

export function AppShell() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearSession();
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary">
      <NavRail onLogout={handleLogout} userEmail={user?.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-6 pt-3.5">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;