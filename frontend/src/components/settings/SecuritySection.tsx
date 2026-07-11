import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';

interface ActiveSessionDto {
  deviceId: string;
  issuedAt: string;
  expiresAt: string;
}

async function fetchActiveSessions(): Promise<ActiveSessionDto[]> {
  const { data } = await apiClient.get<{ sessions: ActiveSessionDto[] }>('/users/me/sessions');
  return data.sessions;
}

async function revokeSession(deviceId: string): Promise<void> {
  await apiClient.delete(`/users/me/sessions/${deviceId}`);
}

/**
 * Active-sessions / revoke-device UI, referenced in Section 7.6's component
 * breakdown but never built. Backed by IUser.refreshTokens (already modeled
 * in User.model.ts) — but GET /users/me/sessions and DELETE
 * /users/me/sessions/:deviceId don't exist as routes yet. This component
 * assumes that surface; flagging as new backend scope, not silent invention.
 */
export function SecuritySection() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchActiveSessions,
  });

  const { mutate: revoke } = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  return (
    <div style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Active Sessions</h2>

      {isLoading && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading sessions…</p>}

      {!isLoading && sessions.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No other active sessions.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sessions.map((session) => (
          <div
            key={session.deviceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--color-bg-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                  Session {session.deviceId.slice(0, 8)}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Expires {new Date(session.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => revoke(session.deviceId)}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: 'var(--color-danger)',
                color: '#0B0F19',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
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

export default SecuritySection;
