import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/components/layout/Header.tsx
// Top navigation bar
import { useLocation } from 'react-router-dom';
import { Bell, RefreshCw, Calendar } from 'lucide-react';
import { useSyncContests } from '../../hooks/useCalendarSync';
import { useCalendarStatus } from '../../hooks/useCalendarSync';
const PAGE_TITLES = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Track upcoming contests across all platforms' },
    '/calendar': { title: 'Calendar', subtitle: 'Visual timeline of your contests' },
    '/notes': { title: 'Notes', subtitle: 'AI-powered contest preparation notes' },
    '/settings': { title: 'Settings', subtitle: 'Customize your experience' },
};
export default function Header() {
    const { pathname } = useLocation();
    const { title, subtitle } = PAGE_TITLES[pathname] ?? { title: 'CalNote', subtitle: '' };
    const { mutate: syncAll, isPending: isSyncing } = useSyncContests();
    const { data: calStatus } = useCalendarStatus();
    return (_jsxs("header", { className: "h-16 flex items-center justify-between px-8 flex-shrink-0", style: {
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(10,15,30,0.7)',
            backdropFilter: 'blur(12px)',
        }, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-lg font-semibold text-white leading-none", children: title }), subtitle && (_jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: subtitle }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [calStatus && (_jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs", style: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }, children: [_jsx(Calendar, { size: 12, className: "text-primary-400" }), _jsxs("span", { className: "text-primary-300", children: [calStatus.syncedCount, " synced"] })] })), _jsxs("button", { onClick: () => syncAll(undefined), disabled: isSyncing, className: "btn-secondary text-xs px-3 py-2", title: "Sync all upcoming contests to Google Calendar", children: [_jsx(RefreshCw, { size: 14, className: isSyncing ? 'animate-spin' : '' }), isSyncing ? 'Syncing...' : 'Sync Calendar'] }), _jsx("button", { className: "w-9 h-9 rounded-lg flex items-center justify-center transition-all", style: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }, children: _jsx(Bell, { size: 16, className: "text-gray-400" }) })] })] }));
}
//# sourceMappingURL=Header.js.map