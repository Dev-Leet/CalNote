
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { NavRail } from './NavRail';
import { ThemeToggle } from '../common/ThemeToggle';
import { HeaderClock } from '../common/HeaderClock';
import { OfflineBanner } from '../common/OfflineBanner';

export function AppShell() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear the PWA's runtime cache of per-user data before clearing the
      // session — closes a real (if low-probability) window where a
      // NetworkFirst cache fallback could serve the outgoing user's stale
      // events/notes/preferences to whoever logs into this browser next,
      // if that happens during a network hiccup. Contests-cache is
      // deliberately left alone — it's not user-specific data.
      if ('caches' in window) {
        try {
          await caches.delete('user-data-cache');
        } catch {
          // Cache API failures here shouldn't block logout — this is a
          // hygiene measure, not something to fail the logout flow over.
        }
      }
      clearSession();
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <OfflineBanner />

      <div className="flex min-h-0 flex-1">
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
    </div>
  );
}

export default AppShell;