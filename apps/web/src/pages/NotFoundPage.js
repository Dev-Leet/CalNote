import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/pages/NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
export default function NotFoundPage() {
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { background: '#0A0F1E' }, children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-8xl font-black gradient-text mb-4", children: "404" }), _jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Page not found" }), _jsx("p", { className: "text-gray-400 mb-8", children: "The page you're looking for doesn't exist." }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsxs("button", { onClick: () => navigate(-1), className: "btn-secondary", children: [_jsx(ArrowLeft, { size: 16 }), " Go back"] }), _jsxs("button", { onClick: () => navigate('/'), className: "btn-primary", children: [_jsx(Home, { size: 16 }), " Home"] })] })] }) }));
}
//# sourceMappingURL=NotFoundPage.js.map