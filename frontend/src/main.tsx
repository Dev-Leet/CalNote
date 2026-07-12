import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useApplyTheme } from './hooks/useApplyTheme';
import './styles/tokens.css';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

function Root() {
  useApplyTheme();
  return <AppRouter />;
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Root />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);