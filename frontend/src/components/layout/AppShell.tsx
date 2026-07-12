
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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-primary)' }}>
      <NavRail onLogout={handleLogout} userEmail={user?.email} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 24px 0' }}>
          <ThemeToggle />
        </div>

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;