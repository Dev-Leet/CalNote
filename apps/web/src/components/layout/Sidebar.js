import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/components/layout/Sidebar.tsx
// Navigation sidebar
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, Settings, LogOut, Zap, Trophy, } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/notes', icon: FileText, label: 'Notes' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];
export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        toast.success('Logged out');
        navigate('/');
    };
    return (_jsxs("aside", { className: "w-64 flex flex-col h-full", style: {
            background: 'rgba(17, 24, 39, 0.8)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
        }, children: [_jsxs("div", { className: "flex items-center gap-3 px-6 py-5 border-b border-white/5", children: [_jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }, children: _jsx(Zap, { size: 18, className: "text-white" }) }), _jsxs("div", { children: [_jsx("span", { className: "font-bold text-white text-base tracking-tight", children: "CalNote" }), _jsx("p", { className: "text-[10px] text-gray-500 leading-none mt-0.5", children: "CP Contest Tracker" })] })] }), _jsx("nav", { className: "flex-1 p-3 space-y-0.5", children: navItems.map(({ to, icon: Icon, label }) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => `nav-item${isActive ? ' active' : ''}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { children: label })] }, to))) }), _jsxs("div", { className: "p-3 border-t border-white/5", children: [user && (_jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1", style: { background: 'rgba(255,255,255,0.03)' }, children: [user.profilePicture ? (_jsx("img", { src: user.profilePicture, alt: user.name || 'User', className: "w-8 h-8 rounded-full ring-2 ring-primary-500/30" })) : (_jsx("div", { className: "w-8 h-8 rounded-full flex items-center justify-center bg-primary-900 text-primary-300 text-sm font-semibold", children: user.name?.[0] ?? 'U' })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: user.name || 'User' }), _jsx("p", { className: "text-[11px] text-gray-500 truncate", children: user.email })] }), _jsx(Trophy, { size: 14, className: "text-yellow-500 flex-shrink-0" })] })), _jsxs("button", { onClick: handleLogout, className: "nav-item w-full justify-start", children: [_jsx(LogOut, { size: 16 }), _jsx("span", { children: "Logout" })] })] })] }));
}
//# sourceMappingURL=Sidebar.js.map