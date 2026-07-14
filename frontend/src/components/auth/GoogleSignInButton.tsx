import { useEffect, useRef } from 'react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface GoogleAuthResponse {
  user: { id: string; email: string; role: 'user' | 'admin' };
  accessToken: string;
}

/**
 * Renders Google's own official sign-in button via Google Identity Services
 * (loaded as a <script> tag in index.html — see env.d.ts for the ambient
 * window.google typing). GIS handles the entire client-side OAuth dance and
 * hands us a signed ID token, which we verify server-side in
 * POST /auth/google/signin — the frontend never sees or trusts any identity
 * claim on its own.
 */
export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const { data } = await apiClient.post<GoogleAuthResponse>('/auth/google/signin', {
            idToken: response.credential,
          });
          setSession(data.user, data.accessToken);
          onSuccess();
        } catch {
          onError('Google sign-in failed. Please try again.');
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, [onSuccess, onError, setSession]);

  return <div ref={buttonRef} />;
}

export default GoogleSignInButton;