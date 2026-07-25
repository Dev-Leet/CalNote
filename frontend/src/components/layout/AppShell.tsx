import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { HelpCircle, Menu } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { NavRail } from './NavRail';
import { ThemeToggle } from '../common/ThemeToggle';
import { HeaderClock } from '../common/HeaderClock';
import { OfflineBanner } from '../common/OfflineBanner';

export function AppShell() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const openMobileNav = useUiStore((s) => s.openMobileNav);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);
  const location = useLocation();

  useEffect(() => {
    closeMobileNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      if ('caches' in window) {
        try {
          await caches.delete('user-data-cache');
        } catch {
          // Cache API failures here shouldn't block logout.
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
          <div className="flex items-center justify-between gap-2 px-4 pt-3.5 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              {/* Hamburger — mobile only, opens the NavRail drawer. This is
                  the direct fix for "no way to navigate without the rail
                  permanently taking space" — the rail is gone by default on
                  mobile now, this button is how you get it back. */}
              <button
                type="button"
                onClick={openMobileNav}
                aria-label="Open navigation"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated text-text-secondary md:hidden"
              >
                <Menu size={18} />
              </button>
              <HeaderClock />
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
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

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;