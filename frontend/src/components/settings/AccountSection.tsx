import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
 
export function AccountSection() {
  const user = useAuthStore((s) => s.user);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  const { mutate: unlinkGoogle, isPending: isUnlinking } = useMutation({
    mutationFn: () => apiClient.post('/auth/google/unlink'),
  });

  const handleLinkGoogle = () => {
    setIsLinkingGoogle(true);
    // Redirects to the backend's Google OAuth consent flow (GET /auth/google/consent,
    // not yet generated as a route — config/google.ts's getGoogleConsentUrl()
    // provides the URL-building half).
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/consent`;
  };

  return (
    <div style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Account</h2>

      <Field label="Email">
        <input type="text" value={user?.email ?? ''} disabled style={{ ...inputStyle, opacity: 0.6 }} />
      </Field>

      <Field label="Google Calendar">
        <button
          type="button"
          onClick={handleLinkGoogle}
          disabled={isLinkingGoogle}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: 'none',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            cursor: isLinkingGoogle ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {isLinkingGoogle ? 'Redirecting…' : 'Link Google Calendar'}
        </button>
      </Field>

      <button
        type="button"
        onClick={() => unlinkGoogle()}
        disabled={isUnlinking}
        style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        Unlink Google Calendar
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
      {label}
      {children}
    </label>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '20px',
  borderRadius: '14px',
  background: 'var(--color-bg-surface)',
};

const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', color: 'var(--color-text-primary)', margin: 0 };

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  width: '100%',
};

export default AccountSection;
