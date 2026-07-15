
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { NavRail } from './NavRail';
import { ThemeToggle } from '../common/ThemeToggle';
import { HeaderClock } from '../common/HeaderClock';

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
        <div className="flex items-center justify-between gap-3 px-6 pt-3.5">
          <HeaderClock />
          <div className="flex items-center gap-3">
          <Link
            to="/help"
            title="Help & Guide"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated text-text-secondary"
          >
            <HelpCircle size={16} />
          </Link>
          <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;