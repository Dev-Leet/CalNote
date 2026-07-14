import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const SIZE_MAP = {
  sm: { box: 'h-7 w-7', text: 'text-sm' },
  md: { box: 'h-9 w-9', text: 'text-lg' },
  lg: { box: 'h-14 w-14', text: 'text-2xl' },
};

/**
 * Placeholder logo mark, used everywhere the app currently shows a
 * brand/logo slot (NavRail top, LandingPage header, AuthPage). Swap the
 * <div> mark below for an <img src="/logo.svg" ... /> once a real asset
 * exists — every consumer of this component picks up the change
 * automatically, since none of them render a logo directly.
 *
 * Deliberately styled as an OBVIOUS placeholder (dashed border, muted
 * "LOGO" label) rather than a plausible-looking generic icon — the goal is
 * that it's impossible to mistake for a finished asset and ship by accident.
 */
export function AppLogo({ size = 'md', showWordmark = true }: AppLogoProps) {
  const { box, text } = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} flex flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed border-accent-ashna/50 bg-accent-ashna-tint`}
        aria-label="CP Calendar Pro logo placeholder"
      >
        <span className="text-[9px] font-bold uppercase leading-none tracking-wide text-accent-ashna">
          Logo
        </span>
      </div>
      {showWordmark && (
        <span className={`${text} font-bold text-text-primary`}>CP Calendar Pro</span>
      )}
    </div>
  );
}

export default AppLogo;