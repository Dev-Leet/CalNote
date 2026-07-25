
import { NavLink, Link } from 'react-router-dom';
import { Home, Calendar, Trophy, StickyNote, Code2, Settings, LogOut, X } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { useUiStore } from '../../stores/uiStore';

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

/**
 * Responsive nav rail: an always-visible narrow icon rail on desktop
 * (md and up, unchanged from before), and an off-canvas slide-in drawer
 * on mobile — this is the direct fix for the screenshots showing the rail
 * permanently eating ~72px of a ~375px viewport. Below md, the rail is
 * translated fully off-screen by default and only slides in when
 * isMobileNavOpen is true (toggled via a hamburger button added to
 * AppShell in this same phase).
 */
export function NavRail({ onLogout, userEmail }: NavRailProps) {
  const isMobileNavOpen = useUiStore((s) => s.isMobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);

  return (
    <>
      {/* Backdrop — mobile only, only rendered while the drawer is open.
          Clicking it closes the nav, same as tapping outside any drawer. */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col gap-2 border-r border-border-subtle bg-bg-primary py-5 transition-transform duration-200 ease-out md:relative md:z-auto md:w-[72px] md:translate-x-0 md:items-center md:bg-transparent md:transition-none ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:justify-center md:px-0">
          <Link to="/home" onClick={closeMobileNav} title="CP Calendar Pro">
            <AppLogo size="sm" showWordmark={false} />
          </Link>
          {/* Close button — mobile only, redundant with the backdrop click
              but keeps the drawer keyboard/screen-reader operable without
              relying on a click-outside gesture. */}
          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Close navigation"
            className="text-text-secondary md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-1 px-2 md:items-center md:px-0">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobileNav}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors md:h-11 md:w-11 md:justify-center md:px-0 md:py-0 ${
                  isActive
                    ? 'bg-accent-ashna text-bg-primary'
                    : 'text-text-secondary hover:bg-bg-elevated'
                }`
              }
            >
              <Icon size={20} />
              {/* Label text shows on the mobile drawer (room for it), hidden
                  on the icon-only desktop rail — matches the original
                  desktop appearance exactly, only mobile presentation changes. */}
              <span className="md:hidden">{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => {
            closeMobileNav();
            onLogout();
          }}
          title={userEmail ? `Log out (${userEmail})` : 'Log out'}
          className="mx-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated md:mx-0 md:h-11 md:w-11 md:justify-center md:px-0 md:py-0"
        >
          <LogOut size={20} />
          <span className="md:hidden">Log out</span>
        </button>
      </nav>
    </>
  );
}

export default NavRail;