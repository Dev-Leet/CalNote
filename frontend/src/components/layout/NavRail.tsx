import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Calendar, Trophy, StickyNote, Code2, Settings, LogOut } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Home, end: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/code', label: 'Code', icon: Code2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface NavRailProps {
  onLogout: () => void;
  userEmail?: string;
}

export function NavRail({ onLogout, userEmail }: NavRailProps) {
  return (
    <nav className="flex w-[72px] flex-col items-center gap-2 border-r border-border-subtle py-5">
      <Link to="/home" className="mb-3" title="CP Calendar Pro">
        <AppLogo size="sm" showWordmark={false} />
      </Link>

      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
              isActive
                ? 'bg-accent-ashna text-bg-primary'
                : 'text-text-secondary hover:bg-bg-elevated'
            }`
          }
        >
          <Icon size={20} />
        </NavLink>
      ))}

      <div className="flex-1" />

      <button
        type="button"
        onClick={onLogout}
        title={userEmail ? `Log out (${userEmail})` : 'Log out'}
        className="flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated"
      >
        <LogOut size={20} />
      </button>
    </nav>
  );
}

export default NavRail;