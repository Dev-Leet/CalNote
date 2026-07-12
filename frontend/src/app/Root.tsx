import React from 'react';
import { AppRouter } from './router';
import { useApplyTheme } from '../hooks/useApplyTheme';

export function Root() {
  useApplyTheme();
  return <AppRouter />;
}

export default Root;