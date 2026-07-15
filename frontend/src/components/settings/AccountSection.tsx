import { useState } from 'react';
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
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/consent`;
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-bg-surface p-5">
      <h2 className="m-0 text-base text-text-primary">Account</h2>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Email
        <input
          type="text"
          value={user?.email ?? ''}
          disabled
          className="w-full rounded-sm bg-bg-elevated px-3 py-2.5 text-sm text-text-primary opacity-60"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
        Google Calendar
        <button
          type="button"
          onClick={handleLinkGoogle}
          disabled={isLinkingGoogle}
          className={`self-start rounded-pill bg-bg-elevated px-4 py-2 text-[13px] text-text-primary ${
            isLinkingGoogle ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isLinkingGoogle ? 'Redirecting…' : 'Link Google Calendar'}
        </button>
      </label>

      <button
        type="button"
        onClick={() => unlinkGoogle()}
        disabled={isUnlinking}
        className="self-start bg-transparent p-0 text-xs text-text-secondary"
      >
        Unlink Google Calendar
      </button>
    </div>
  );
}

export default AccountSection;