import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Root } from './app/Root';
import { InstallPrompt } from './components/common/InstallPrompt';
import { UpdatePrompt } from './components/common/UpdatePrompt';
import './styles/tokens.css';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Root />
        <InstallPrompt />
        <UpdatePrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);