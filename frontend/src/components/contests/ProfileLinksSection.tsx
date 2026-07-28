
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus, X } from 'lucide-react';
import apiClient from '../../api/client';
import { UserPreferencesDto, ProfileLinkDto } from '../../types/shared';

const PLATFORM_PRESETS = [
  { value: 'codeforces', label: 'Codeforces' },
  { value: 'leetcode', label: 'LeetCode' },
  { value: 'codechef', label: 'CodeChef' },
  { value: 'atcoder', label: 'AtCoder' },
  { value: 'custom', label: 'Other' },
];

async function fetchPreferences(): Promise<UserPreferencesDto> {
  const { data } = await apiClient.get<{ preferences: UserPreferencesDto }>('/users/me/preferences');
  return data.preferences;
}

async function savePreferences(profileLinks: ProfileLinkDto[]): Promise<UserPreferencesDto> {
  const { data } = await apiClient.patch<{ preferences: UserPreferencesDto }>('/users/me/preferences', {
    profileLinks,
  });
  return data.preferences;
}

/**
 * Lets a user save links to their own CP profiles and click straight
 * through to them — sits on the Contests page since that's the natural
 * "your competitive programming identity" context, rather than Settings.
 */
export function ProfileLinksSection() {
  const queryClient = useQueryClient();
  const { data: preferences } = useQuery({ queryKey: ['preferences'], queryFn: fetchPreferences });

  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState('codeforces');
  const [customLabel, setCustomLabel] = useState('');
  const [url, setUrl] = useState('');

  const links = preferences?.profileLinks ?? [];

  const { mutate: save, isPending } = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
      setIsAdding(false);
      setUrl('');
      setCustomLabel('');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const label = platform === 'custom' ? customLabel.trim() || 'Profile' : PLATFORM_PRESETS.find((p) => p.value === platform)!.label;
    save([...links, { platform, label, url: url.trim() }]);
  };

  const handleRemove = (index: number) => {
    save(links.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold text-text-primary">My CP Profiles</h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-pill bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {links.length === 0 && !isAdding && (
        <p className="m-0 text-xs text-text-secondary">
          Add links to your Codeforces, LeetCode, or other CP profiles for quick access.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {links.map((link, index) => (
          <div key={`${link.platform}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-bg-elevated px-3 py-2">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-1.5 text-[13px] text-accent-ashna no-underline hover:underline"
            >
              <ExternalLink size={12} className="flex-shrink-0" />
              <span className="truncate">{link.label}</span>
            </a>
            <button type="button" onClick={() => handleRemove(index)} aria-label="Remove" className="flex-shrink-0 text-text-secondary">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-md bg-bg-elevated p-3">
          <div className="flex gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-sm bg-bg-primary px-2 py-1.5 text-xs text-text-primary"
            >
              {PLATFORM_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {platform === 'custom' && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-sm bg-bg-primary px-2 py-1.5 text-xs text-text-primary"
              />
            )}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://codeforces.com/profile/yourhandle"
            required
            className="rounded-sm bg-bg-primary px-2 py-1.5 text-xs text-text-primary"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-pill bg-accent-ashna px-3 py-1.5 text-[11px] font-semibold text-bg-primary"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-pill bg-bg-primary px-3 py-1.5 text-[11px] text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfileLinksSection;