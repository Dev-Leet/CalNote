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
      } catch {
        toast.error('Failed to authenticate. Please try again.');
        navigate('/', { replace: true });
      }
    })();
  }, [searchParams, navigate, setToken, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <Zap size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Signing you in...</h2>
        <p className="text-gray-400 text-sm">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}
