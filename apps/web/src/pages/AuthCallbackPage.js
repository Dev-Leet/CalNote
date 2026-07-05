import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/pages/AuthCallbackPage.tsx
// Handles the JWT token from the OAuth redirect
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';
export default function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken, fetchUser } = useAuthStore();
    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        if (error) {
            toast.error('Authentication failed. Please try again.');
            navigate('/', { replace: true });
            return;
        }
        if (!token) {
            toast.error('No authentication token received.');
            navigate('/', { replace: true });
            return;
        }
        (async () => {
            try {
                setToken(token);
                await fetchUser();
                toast.success('Welcome to CalNote! 🚀');
                navigate('/dashboard', { replace: true });
            }
            catch {
                toast.error('Failed to authenticate. Please try again.');
                navigate('/', { replace: true });
            }
        })();
    }, [searchParams, navigate, setToken, fetchUser]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { background: '#0A0F1E' }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse", style: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }, children: _jsx(Zap, { size: 28, className: "text-white" }) }), _jsx("h2", { className: "text-xl font-semibold text-white mb-2", children: "Signing you in..." }), _jsx("p", { className: "text-gray-400 text-sm", children: "Please wait while we set up your account." })] }) }));
}
//# sourceMappingURL=AuthCallbackPage.js.map