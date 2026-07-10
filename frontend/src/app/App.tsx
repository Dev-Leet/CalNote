import React from 'react';
import { AppRouter } from './router';

/**
 * Thin composition root. QueryClientProvider and ErrorBoundary are mounted
 * one level up in main.tsx (they wrap App, not the other way around) so
 * App itself stays a simple entry point — kept as its own file per the
 * Project Structure doc's stated layout, even though main.tsx could
 * technically render AppRouter directly.
 */
export function App() {
  return <AppRouter />;
}

export default App;
