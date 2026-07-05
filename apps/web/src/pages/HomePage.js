import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/pages/HomePage.tsx
// Public landing page
import { useNavigate } from 'react-router-dom';
import { Calendar, Zap, Bell, FileText, ArrowRight, Github, Code2, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const FEATURES = [
    {
        icon: Zap,
        title: 'Auto Contest Sync',
        desc: 'Automatically fetches upcoming contests from LeetCode, Codeforces & CodeChef every 6 hours.',
        color: '#6366f1',
    },
    {
        icon: Calendar,
        title: 'Google Calendar Integration',
        desc: 'Sync your favourite contests directly to Google Calendar with smart reminders.',
        color: '#10b981',
    },
    {
        icon: Bell,
        title: 'Smart Reminders',
        desc: 'Get notified 5 minutes and 15 minutes before every contest starts.',
        color: '#f59e0b',
    },
    {
        icon: FileText,
        title: 'AI-Powered Notes',
        desc: 'Generate personalized preparation notes for any contest using AI.',
        color: '#8b5cf6',
    },
];
const PLATFORMS = [
    { name: 'LeetCode', color: '#FFA116', logo: '🟡', contests: 'Weekly + Biweekly' },
    { name: 'Codeforces', color: '#1F8ACB', logo: '🔵', contests: 'Div. 1, 2, 3, 4 + Educational' },
    { name: 'CodeChef', color: '#B17A2F', logo: '🟤', contests: 'Starters + Long Challenge' },
];
export default function HomePage() {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated)
            navigate('/dashboard');
    }, [isAuthenticated, navigate]);
    const handleLogin = () => {
        window.location.href = `${API_BASE_URL}/api/v1/auth/google`;
    };
    return (_jsxs("div", { className: "min-h-screen", style: { background: '#0A0F1E' }, children: [_jsx("div", { className: "fixed inset-0 mesh-gradient pointer-events-none" }), _jsx("div", { className: "fixed inset-0 hero-gradient pointer-events-none" }), _jsxs("nav", { className: "relative z-10 flex items-center justify-between px-6 md:px-12 py-5", style: { borderBottom: '1px solid rgba(255,255,255,0.05)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }, children: _jsx(Zap, { size: 18, className: "text-white" }) }), _jsx("span", { className: "font-bold text-white text-lg tracking-tight", children: "CalNote" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("a", { href: "https://github.com", target: "_blank", rel: "noopener noreferrer", className: "btn-ghost text-sm px-3 py-2", children: [_jsx(Github, { size: 16 }), "GitHub"] }), _jsxs("button", { onClick: handleLogin, className: "btn-primary text-sm", children: [_jsx("span", { children: "Sign in with Google" }), _jsx(ArrowRight, { size: 15 })] })] })] }), _jsxs("section", { className: "relative z-10 text-center px-4 pt-28 pb-20", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8", style: {
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                        }, children: [_jsx(Zap, { size: 13 }), _jsx("span", { children: "Auto-syncing contests every 6 hours" })] }), _jsxs("h1", { className: "text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight", children: ["Never miss a", _jsx("br", {}), _jsx("span", { className: "gradient-text", children: "coding contest" }), _jsx("br", {}), "again"] }), _jsx("p", { className: "text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed", children: "CalNote tracks all your competitive programming contests from LeetCode, Codeforces and CodeChef \u2014 and syncs them to Google Calendar with smart reminders." }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [_jsxs("button", { onClick: handleLogin, id: "hero-login-btn", className: "btn-primary text-base px-8 py-3.5", style: { fontSize: '1rem' }, children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", className: "flex-shrink-0", children: [_jsx("path", { fill: "#fff", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#aab4fc", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#cdd5fc", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#e0e7ff", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Get started free"] }), _jsxs("a", { href: "#features", className: "btn-secondary text-base px-7 py-3.5", children: [_jsx(Code2, { size: 16 }), "See features"] })] }), _jsx("div", { className: "mt-16 flex items-center justify-center gap-8 flex-wrap", children: [
                            { value: '3', label: 'Platforms tracked' },
                            { value: '∞', label: 'Contests synced' },
                            { value: '6h', label: 'Refresh interval' },
                        ].map(({ value, label }) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-extrabold gradient-text", children: value }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: label })] }, label))) })] }), _jsx("section", { className: "relative z-10 px-6 py-12 max-w-4xl mx-auto", children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: PLATFORMS.map((p) => (_jsxs("div", { className: "glass-card text-center py-5", children: [_jsx("span", { className: "text-4xl mb-3 block", children: p.logo }), _jsx("p", { className: "font-bold text-white", children: p.name }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: p.contests })] }, p.name))) }) }), _jsxs("section", { id: "features", className: "relative z-10 px-6 py-16 max-w-5xl mx-auto", children: [_jsxs("h2", { className: "text-3xl font-bold text-white text-center mb-4", children: ["Everything you need to", _jsx("span", { className: "gradient-text", children: " stay competitive" })] }), _jsx("p", { className: "text-center text-gray-400 mb-12 max-w-xl mx-auto", children: "Built for competitive programmers who want to focus on solving problems, not tracking schedules." }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: FEATURES.map(({ icon: Icon, title, desc, color }) => (_jsxs("div", { className: "glass-card flex gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center", style: { background: `${color}20`, border: `1px solid ${color}30` }, children: _jsx(Icon, { size: 18, style: { color } }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white mb-1", children: title }), _jsx("p", { className: "text-sm text-gray-400 leading-relaxed", children: desc })] })] }, title))) })] }), _jsx("section", { className: "relative z-10 text-center px-6 py-20", children: _jsxs("div", { className: "max-w-2xl mx-auto p-12 rounded-2xl", style: {
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.15)',
                    }, children: [_jsx(Trophy, { size: 40, className: "text-yellow-400 mx-auto mb-4" }), _jsx("h2", { className: "text-3xl font-bold text-white mb-3", children: "Ready to level up?" }), _jsx("p", { className: "text-gray-400 mb-8", children: "Join competitive programmers who never miss a contest." }), _jsxs("button", { onClick: handleLogin, id: "cta-login-btn", className: "btn-primary text-base px-8 py-3.5 mx-auto", children: ["Start tracking for free", _jsx(ArrowRight, { size: 16 })] })] }) }), _jsx("footer", { className: "relative z-10 text-center py-8 border-t border-white/5", children: _jsx("p", { className: "text-gray-500 text-sm", children: "\u00A9 2024 CalNote. Built for competitive programmers. \u26A1" }) })] }));
}
//# sourceMappingURL=HomePage.js.map