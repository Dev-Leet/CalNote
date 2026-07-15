import React, { useRef, useState } from 'react';

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
 * Real logo assets, served from Vite's `public/` directory (files there are
 * copied as-is to the build root, so /assets/... resolves correctly both in
 * dev and in the production build — no import needed for static public
 * assets).
 *
 * Interaction: clicking the static image swaps it for the video in the
 * exact same slot (same box, same aspect handling via object-cover), the
 * video autoplays muted (required for autoplay to be allowed by browsers
 * without a prior user gesture on the <video> element itself — the click
 * that triggered this IS the gesture, but autoplay policies are keyed to
 * the play() call needing the tag itself unmuted-safe; muted keeps this
 * robust across browsers), and onEnded reverts back to the static image.
 */
export function AppLogo({ size = 'md', showWordmark = true }: AppLogoProps) {
  const { box, text } = SIZE_MAP[size];
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageClick = () => {
    setIsPlaying(true);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} flex-shrink-0 overflow-hidden rounded-md`}>
        {isPlaying ? (
          <video
            ref={videoRef}
            src="/assets/LOGO_Video.mp4"
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            aria-label="CP Calendar Pro logo animation"
          />
        ) : (
          <img
            src="/assets/LOGO.png"
            alt="CP Calendar Pro logo"
            onClick={handleImageClick}
            className="h-full w-full cursor-pointer object-cover"
            title="Click to play"
          />
        )}
      </div>
      {showWordmark && <span className={`${text} font-bold text-text-primary`}>CP Calendar Pro</span>}
    </div>
  );
}

export default AppLogo;