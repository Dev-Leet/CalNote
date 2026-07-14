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
    <div className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
      <h2 className="m-0 text-base text-text-primary">Active Sessions</h2>

      {isLoading && <p className="text-[13px] text-text-secondary">Loading sessions…</p>}

      {!isLoading && sessions.length === 0 && (
        <p className="text-[13px] text-text-secondary">No other active sessions.</p>
      )}

      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <div
            key={session.deviceId}
            className="flex items-center justify-between rounded-md bg-bg-elevated px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-success" />
              <div>
                <p className="m-0 text-[13px] text-text-primary">Session {session.deviceId.slice(0, 8)}</p>
                <p className="m-0 text-[11px] text-text-secondary">
                  Expires {new Date(session.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => revoke(session.deviceId)}
              className="rounded-pill bg-danger px-3 py-1.5 text-xs font-semibold text-bg-primary"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecuritySection;