import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/pages/CalendarPage.tsx
// FullCalendar view showing all upcoming contests
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useUpcomingContests } from '../hooks/useContests';
import { Platform, PLATFORM_INFO } from '@cp-calendar/shared';
import { useSyncContests } from '../hooks/useCalendarSync';
import { toast } from 'sonner';
import { Calendar, ExternalLink } from 'lucide-react';
import { useState } from 'react';
const PLATFORM_COLORS = {
    [Platform.LEETCODE]: '#FFA116',
    [Platform.CODEFORCES]: '#1F8ACB',
    [Platform.CODECHEF]: '#B17A2F',
};
export default function CalendarPage() {
    const { data: contests = [], isLoading } = useUpcomingContests(60);
    const { mutate: sync, isPending: isSyncing } = useSyncContests();
    const [selected, setSelected] = useState(null);
    const events = contests.map((c) => ({
        id: c.id,
        title: `${PLATFORM_INFO[c.platform].logo} ${c.name}`,
        start: c.startTime,
        end: c.endTime,
        backgroundColor: PLATFORM_COLORS[c.platform] + '30',
        borderColor: PLATFORM_COLORS[c.platform],
        textColor: '#f9fafb',
        extendedProps: {
            platform: c.platform,
            url: c.url,
            duration: c.duration,
        },
    }));
    const handleEventClick = (info) => {
        setSelected({
            id: info.event.id,
            title: info.event.title,
            platform: info.event.extendedProps.platform,
            url: info.event.extendedProps.url,
            start: info.event.startStr,
            end: info.event.endStr,
            duration: info.event.extendedProps.duration,
        });
    };
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-4", children: Object.entries(PLATFORM_COLORS).map(([p, color]) => (_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-gray-400", children: [_jsx("span", { className: "w-3 h-3 rounded-sm", style: { backgroundColor: color } }), PLATFORM_INFO[p].name] }, p))) }), _jsxs("button", { onClick: () => {
                            sync(undefined);
                            toast.info('Syncing all contests...');
                        }, disabled: isSyncing, className: "btn-primary text-sm", children: [_jsx(Calendar, { size: 14, className: isSyncing ? 'animate-spin' : '' }), isSyncing ? 'Syncing...' : 'Sync All'] })] }), _jsx("div", { className: "glass-card !p-5 overflow-hidden", children: isLoading ? (_jsx("div", { className: "h-96 flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Loading calendar..." }) })) : (_jsx(FullCalendar, { plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin], initialView: "dayGridMonth", headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek',
                    }, events: events, eventClick: handleEventClick, height: "auto", eventDisplay: "block", dayMaxEvents: 3, moreLinkText: (n) => `+${n} more`, nowIndicator: true, eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: 'short' } })) }), selected && (_jsx("div", { className: "glass-card animate-slide-up", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex items-center gap-2 mb-2", children: _jsxs("span", { className: `badge-${selected.platform.toLowerCase()} px-2 py-0.5 rounded-md text-xs font-semibold`, children: [PLATFORM_INFO[selected.platform].logo, " ", PLATFORM_INFO[selected.platform].name] }) }), _jsx("h3", { className: "text-lg font-semibold text-white mb-1", children: selected.title.replace(/^[^\s]+\s/, '') }), _jsxs("p", { className: "text-sm text-gray-400", children: [new Date(selected.start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }), " IST"] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Duration: ", Math.floor(selected.duration / 60), "h ", selected.duration % 60, "m"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("a", { href: selected.url, target: "_blank", rel: "noopener noreferrer", className: "btn-secondary text-xs px-3 py-2", children: [_jsx(ExternalLink, { size: 13 }), "Open"] }), _jsxs("button", { onClick: () => {
                                        sync([selected.id]);
                                        setSelected(null);
                                    }, className: "btn-primary text-xs px-3 py-2", disabled: isSyncing, children: [_jsx(Calendar, { size: 13 }), "Sync"] }), _jsx("button", { onClick: () => setSelected(null), className: "btn-ghost px-2 py-2", children: "\u2715" })] })] }) }))] }));
}
//# sourceMappingURL=CalendarPage.js.map