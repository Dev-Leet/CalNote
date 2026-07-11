
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, StickyNote, Settings, LogOut } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
 
const NAV_ITEMS = [
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/settings', label: 'Settings', icon: Settings },
];

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
      <nav
        style={{
          width: '72px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          borderRight: '1px solid var(--color-bg-elevated)',
          gap: '8px',
        }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              color: isActive ? '#0B0F19' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-accent-ashna)' : 'transparent',
              textDecoration: 'none',
            })}
          >
            <Icon size={20} />
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={handleLogout}
          title={user ? `Log out (${user.email})` : 'Log out'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <LogOut size={20} />
        </button>
      </nav>

      <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
