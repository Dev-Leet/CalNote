import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { AppLogo } from '../components/common/AppLogo';

type Mode = 'login' | 'register';

interface AuthResponse {
  user: { id: string; email: string; role: 'user' | 'admin' };
  accessToken: string;
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await apiClient.post<AuthResponse>(endpoint, { email, password });
      setSession(data.user, data.accessToken);
      navigate('/home', { replace: true });
    } catch (err) {
      let message = 'Something went wrong. Please try again.';
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as { message?: string } | undefined)?.message ?? message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary">
      <form onSubmit={handleSubmit} className="flex w-[360px] flex-col gap-4 rounded-lg bg-bg-surface p-8">
        <div className="mb-1 flex justify-center">
          <AppLogo size="lg" showWordmark={false} />
        </div>
        <h1 className="m-0 text-center text-xl text-text-primary">
          {mode === 'login' ? 'Log in to CP Calendar Pro' : 'Create your account'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-md bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="rounded-md bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none"
        />

        {error && <p className="m-0 text-[13px] text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded-md bg-accent-ashna px-3.5 py-2.5 text-sm font-semibold text-bg-primary ${
            isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="bg-transparent p-0 text-[13px] text-text-secondary"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>

        <div className="my-1 flex items-center gap-2.5">
          <div className="h-px flex-1 bg-bg-elevated" />
          <span className="text-[11px] text-text-secondary">OR</span>
          <div className="h-px flex-1 bg-bg-elevated" />
        </div>

        <GoogleSignInButton
          onSuccess={() => navigate('/home', { replace: true })}
          onError={setError}
        />
      </form>
    </div>
  );
}

export default AuthPage;