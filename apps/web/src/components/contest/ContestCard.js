import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/components/contest/ContestCard.tsx
// Individual contest card with platform badge, countdown, and sync action
import { ExternalLink, Calendar, Clock, Timer } from 'lucide-react';
import { Platform, PLATFORM_INFO } from '@cp-calendar/shared';
import { getCountdown, formatDuration, isLive } from '@cp-calendar/shared';
import { useSyncContests } from '../../hooks/useCalendarSync';
import { format } from 'date-fns';
const PLATFORM_DOT_COLORS = {
    [Platform.LEETCODE]: '#FFA116',
    [Platform.CODEFORCES]: '#1F8ACB',
    [Platform.CODECHEF]: '#B17A2F',
};
export default function ContestCard({ contest, compact }) {
    const { mutate: sync, isPending } = useSyncContests();
    const info = PLATFORM_INFO[contest.platform];
    const live = isLive(contest.startTime, contest.endTime);
    const countdown = getCountdown(contest.startTime);
    const dotColor = PLATFORM_DOT_COLORS[contest.platform];
    const startLocal = new Date(contest.startTime);
    const timeStr = format(startLocal, 'dd MMM yyyy, hh:mm a');
    const platformClass = `badge-${contest.platform.toLowerCase()}`;
    return (_jsxs("div", { className: "glass-card relative overflow-hidden group", style: { animationDelay: '0.05s' }, children: [live && (_jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                    background: `radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.06), transparent 60%)`,
                } })), _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${platformClass}`, children: [_jsx("span", { className: "text-[10px]", children: info.logo }), info.name] }), contest.difficulty && (_jsx("span", { className: "text-[11px] text-gray-500 font-medium", children: contest.difficulty })), live && (_jsxs("span", { className: "flex items-center gap-1 text-[11px] font-semibold text-emerald-400", children: [_jsx("span", { className: "status-dot live" }), "LIVE"] }))] }), _jsx("h3", { className: "font-semibold text-white text-sm leading-snug truncate group-hover:text-primary-300 transition-colors", children: contest.name }), !compact && (_jsxs("div", { className: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 11 }), timeStr] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Timer, { size: 11 }), formatDuration(contest.duration)] })] }))] }), _jsxs("div", { className: "flex flex-col items-end gap-2 flex-shrink-0", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[11px] text-gray-500 leading-none mb-0.5", children: live ? 'Ends in' : 'Starts in' }), _jsx("p", { className: "text-xs font-bold", style: { color: live ? '#10b981' : dotColor }, children: live
                                            ? getCountdown(contest.endTime).replace('Starts in', '')
                                            : countdown.replace('Starts in ', '') })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("a", { href: contest.url, target: "_blank", rel: "noopener noreferrer", className: "w-7 h-7 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-white", style: { background: 'rgba(255,255,255,0.05)' }, title: "Open contest", children: _jsx(ExternalLink, { size: 12 }) }), _jsx("button", { onClick: () => sync([contest.id]), disabled: isPending, className: "w-7 h-7 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-primary-400", style: { background: 'rgba(255,255,255,0.05)' }, title: "Sync to Google Calendar", children: _jsx(Calendar, { size: 12, className: isPending ? 'animate-spin' : '' }) })] })] })] })] }));
}
//# sourceMappingURL=ContestCard.js.map