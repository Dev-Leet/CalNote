import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/App.tsx
// Root application component with routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
function App() {
    const { initializeAuth } = useAuthStore();
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);
    return (_jsxs(Router, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/auth/callback", element: _jsx(AuthCallbackPage, {}) }), _jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/calendar", element: _jsx(CalendarPage, {}) }), _jsx(Route, { path: "/notes", element: _jsx(NotesPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }), _jsx(Toaster, { position: "top-right", richColors: true, theme: "dark", toastOptions: {
                    style: {
                        background: 'rgba(26, 31, 58, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f9fafb',
                        backdropFilter: 'blur(12px)',
                    },
                } })] }));
}
export default App;
//# sourceMappingURL=App.js.map