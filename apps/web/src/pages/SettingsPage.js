import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// apps/web/src/pages/SettingsPage.tsx
// User settings: profile, notifications, platforms, calendar
import { useState, useEffect } from 'react';
import { User, Bell, Calendar, Monitor, Save, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';
import { toast } from 'sonner';
import { useCalendarStatus } from '../hooks/useCalendarSync';
const PLATFORMS = ['LEETCODE', 'CODEFORCES', 'CODECHEF'];
const PLATFORM_LABELS = {
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
        enabledPlatforms: user?.enabledPlatforms ?? {
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
                enabledPlatforms: user.enabledPlatforms,
            });
        }
    }, [user]);
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.put('/auth/settings', settings);
            await fetchUser();
            toast.success('Settings saved!');
        }
        catch {
            toast.error('Failed to save settings');
        }
        finally {
            setIsSaving(false);
        }
    };
    const toggle = (key) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const togglePlatform = (platform) => {
        setSettings((prev) => ({
            ...prev,
            enabledPlatforms: {
                ...prev.enabledPlatforms,
                [platform]: !prev.enabledPlatforms[platform],
            },
        }));
    };
    return (_jsxs("div", { className: "max-w-2xl space-y-6 animate-fade-in", children: [_jsxs("section", { className: "glass-card", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-primary-900/50", children: _jsx(User, { size: 16, className: "text-primary-400" }) }), _jsx("h2", { className: "font-semibold text-white", children: "Profile" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [user?.profilePicture ? (_jsx("img", { src: user.profilePicture, alt: "Profile", className: "w-14 h-14 rounded-full ring-2 ring-primary-500/30" })) : (_jsx("div", { className: "w-14 h-14 rounded-full bg-primary-900 flex items-center justify-center text-xl font-bold text-primary-400", children: user?.name?.[0] ?? 'U' })), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-white", children: user?.name ?? 'User' }), _jsx("p", { className: "text-sm text-gray-400", children: user?.email }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Google account" })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "text-sm text-gray-400 block mb-1.5", children: "Timezone" }), _jsx("select", { value: settings.timezone, onChange: (e) => setSettings((p) => ({ ...p, timezone: e.target.value })), className: "input-glass", children: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Singapore'].map((tz) => (_jsx("option", { value: tz, style: { background: '#1a1f3a' }, children: tz }, tz))) })] })] }), _jsxs("section", { className: "glass-card", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-900/30", children: _jsx(Calendar, { size: 16, className: "text-emerald-400" }) }), _jsx("h2", { className: "font-semibold text-white", children: "Google Calendar" })] }), _jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl", style: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Calendar Status" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: calStatus?.connected ? `${calStatus.syncedCount} contests synced` : 'Not connected' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `status-dot ${calStatus?.connected ? 'live' : 'upcoming'}` }), _jsx("span", { className: "text-xs font-medium", style: { color: calStatus?.connected ? '#10b981' : '#9ca3af' }, children: calStatus?.connected ? 'Connected' : 'Disconnected' })] })] }), !calStatus?.connected && (_jsxs("p", { className: "text-xs text-gray-500 mt-3 flex items-center gap-1", children: [_jsx(ExternalLink, { size: 11 }), "Re-login with Google to grant Calendar permissions"] }))] }), _jsxs("section", { className: "glass-card", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-900/30", children: _jsx(Bell, { size: 16, className: "text-yellow-400" }) }), _jsx("h2", { className: "font-semibold text-white", children: "Reminder Notifications" })] }), _jsx("div", { className: "space-y-3", children: [
                            { key: 'notifyBefore5Min', label: '5 minutes before' },
                            { key: 'notifyBefore15Min', label: '15 minutes before' },
                            { key: 'notifyBefore1Hour', label: '1 hour before' },
                            { key: 'notifyBefore1Day', label: '1 day before' },
                        ].map(({ key, label }) => (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-sm text-gray-300", children: label }), _jsx("button", { onClick: () => toggle(key), className: "relative inline-flex w-11 h-6 rounded-full transition-all duration-200", style: {
                                        background: settings[key] ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.1)',
                                    }, children: _jsx("span", { className: "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200", style: { transform: settings[key] ? 'translateX(20px)' : 'translateX(0)' } }) })] }, key))) })] }), _jsxs("section", { className: "glass-card", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-blue-900/30", children: _jsx(Monitor, { size: 16, className: "text-blue-400" }) }), _jsx("h2", { className: "font-semibold text-white", children: "Enabled Platforms" })] }), _jsx("div", { className: "space-y-3", children: PLATFORMS.map((p) => {
                            const info = PLATFORM_LABELS[p];
                            const enabled = settings.enabledPlatforms[p];
                            return (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { children: info.logo }), _jsx("span", { className: "text-sm font-medium", style: { color: info.color }, children: info.name })] }), _jsx("button", { onClick: () => togglePlatform(p), className: "relative inline-flex w-11 h-6 rounded-full transition-all duration-200", style: {
                                            background: enabled ? `${info.color}80` : 'rgba(255,255,255,0.1)',
                                        }, children: _jsx("span", { className: "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200", style: { transform: enabled ? 'translateX(20px)' : 'translateX(0)' } }) })] }, p));
                        }) })] }), _jsx("button", { onClick: handleSave, disabled: isSaving, className: "btn-primary w-full justify-center py-3 text-base", children: isSaving ? (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16, className: "animate-pulse" }), " Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 16 }), " Save Settings"] })) })] }));
}
//# sourceMappingURL=SettingsPage.js.map