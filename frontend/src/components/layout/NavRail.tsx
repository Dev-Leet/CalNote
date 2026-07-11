
import { NavLink } from 'react-router-dom';
import { Calendar, Trophy, StickyNote, Settings, LogOut } from 'lucide-react';
 
const NAV_ITEMS = [
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface NavRailProps {
  onLogout: () => void;
  userEmail?: string;
}

export function NavRail({ onLogout, userEmail }: NavRailProps) {
  return (
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
        onClick={onLogout}
        title={userEmail ? `Log out (${userEmail})` : 'Log out'}
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
  );
}

export default NavRail;
