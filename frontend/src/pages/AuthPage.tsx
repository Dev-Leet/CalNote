import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
 
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
      navigate('/calendar', { replace: true });
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg-primary)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '360px',
          padding: '32px',
          borderRadius: '16px',
          background: 'var(--color-bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h1 style={{ fontSize: '20px', color: 'var(--color-text-primary)', margin: 0 }}>
          {mode === 'login' ? 'Log in to CP Calendar Pro' : 'Create your account'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />

        {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={isSubmitting} style={submitStyle(isSubmitting)}>
          {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '13px', cursor: 'pointer' }}
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: 'none',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
};

const submitStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: '10px',
  border: 'none',
  background: 'var(--color-accent-ashna)',
  color: '#0B0F19',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
});

export default AuthPage;
