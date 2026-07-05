// apps/web/src/pages/NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
      <div className="text-center">
        <p className="text-8xl font-black gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={16} /> Go back
          </button>
          <button onClick={() => navigate('/')} className="btn-primary">
            <Home size={16} /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
