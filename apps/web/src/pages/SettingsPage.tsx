// apps/web/src/pages/SettingsPage.tsx
// User settings: profile, notifications, platforms, calendar

import { useState, useEffect } from 'react';
import { User, Bell, Calendar, Monitor, Save, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';
import { toast } from 'sonner';
import { useCalendarStatus } from '../hooks/useCalendarSync';

const PLATFORMS = ['LEETCODE', 'CODEFORCES', 'CODECHEF'] as const;
const PLATFORM_LABELS: Record<string, { name: string; logo: string; color: string }> = {
  LEETCODE: { name: 'LeetCode', logo: '🟡', color: '#FFA116' },
  CODEFORCES: { name: 'Codeforces', logo: '🔵', color: '#1F8ACB' },
  CODECHEF: { name: 'CodeChef', logo: '🟤', color: '#B17A2F' },
};

export default function SettingsPage() {
  const { user, fetchUser } = useAuthStore();
  const { data: calStatus } = useCalendarStatus();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    timezone: user?.timezone ?? 'Asia/Kolkata',
    notifyBefore5Min: user?.notifyBefore5Min ?? true,
    notifyBefore15Min: user?.notifyBefore15Min ?? true,
    notifyBefore1Hour: user?.notifyBefore1Hour ?? false,
    notifyBefore1Day: user?.notifyBefore1Day ?? false,
    enabledPlatforms: (user?.enabledPlatforms as unknown as Record<string, boolean>) ?? {
      LEETCODE: true,
      CODEFORCES: true,
      CODECHEF: true,
    },
  });

  useEffect(() => {
    if (user) {
      setSettings({
        timezone: user.timezone,
        notifyBefore5Min: user.notifyBefore5Min,
        notifyBefore15Min: user.notifyBefore15Min,
        notifyBefore1Hour: user.notifyBefore1Hour,
        notifyBefore1Day: user.notifyBefore1Day,
        enabledPlatforms: user.enabledPlatforms as unknown as Record<string, boolean>,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/auth/settings', settings);
      await fetchUser();
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const togglePlatform = (platform: string) => {
    setSettings((prev) => ({
      ...prev,
      enabledPlatforms: {
        ...prev.enabledPlatforms,
        [platform]: !prev.enabledPlatforms[platform],
      },
    }));
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">

      {/* Profile */}
      <section className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-900/50">
            <User size={16} className="text-primary-400" />
          </div>
          <h2 className="font-semibold text-white">Profile</h2>
        </div>

        <div className="flex items-center gap-4">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-14 h-14 rounded-full ring-2 ring-primary-500/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-900 flex items-center justify-center text-xl font-bold text-primary-400">
              {user?.name?.[0] ?? 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{user?.name ?? 'User'}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Google account</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-400 block mb-1.5">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}
            className="input-glass"
          >
            {['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Singapore'].map((tz) => (
              <option key={tz} value={tz} style={{ background: '#1a1f3a' }}>{tz}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Calendar */}
      <section className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-900/30">
            <Calendar size={16} className="text-emerald-400" />
          </div>
          <h2 className="font-semibold text-white">Google Calendar</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-medium text-white">Calendar Status</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {calStatus?.connected ? `${calStatus.syncedCount} contests synced` : 'Not connected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`status-dot ${calStatus?.connected ? 'live' : 'upcoming'}`} />
            <span className="text-xs font-medium" style={{ color: calStatus?.connected ? '#10b981' : '#9ca3af' }}>
              {calStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {!calStatus?.connected && (
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <ExternalLink size={11} />
            Re-login with Google to grant Calendar permissions
          </p>
        )}
      </section>

      {/* Notifications */}
      <section className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-900/30">
            <Bell size={16} className="text-yellow-400" />
          </div>
          <h2 className="font-semibold text-white">Reminder Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: 'notifyBefore5Min' as const, label: '5 minutes before' },
            { key: 'notifyBefore15Min' as const, label: '15 minutes before' },
            { key: 'notifyBefore1Hour' as const, label: '1 hour before' },
            { key: 'notifyBefore1Day' as const, label: '1 day before' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">{label}</span>
              <button
                onClick={() => toggle(key)}
                className="relative inline-flex w-11 h-6 rounded-full transition-all duration-200"
                style={{
                  background: settings[key] ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style={{ transform: settings[key] ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-900/30">
            <Monitor size={16} className="text-blue-400" />
          </div>
          <h2 className="font-semibold text-white">Enabled Platforms</h2>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map((p) => {
            const info = PLATFORM_LABELS[p];
            const enabled = settings.enabledPlatforms[p];
            return (
              <div key={p} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span>{info.logo}</span>
                  <span className="text-sm font-medium" style={{ color: info.color }}>{info.name}</span>
                </div>
                <button
                  onClick={() => togglePlatform(p)}
                  className="relative inline-flex w-11 h-6 rounded-full transition-all duration-200"
                  style={{
                    background: enabled ? `${info.color}80` : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Save */}
      <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full justify-center py-3 text-base">
        {isSaving ? (
          <><Save size={16} className="animate-pulse" /> Saving...</>
        ) : (
          <><Save size={16} /> Save Settings</>
        )}
      </button>
    </div>
  );
}
