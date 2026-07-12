import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * App-wide render-error boundary. Nothing previously caught a component
 * throw — this wraps the whole tree in main.tsx so a single broken page
 * doesn't produce a blank white screen for the entire app.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('CP Calendar Pro render error:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }

      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg-primary p-6 text-center">
          <h1 className="m-0 text-lg text-text-primary">Something went wrong</h1>
          <p className="m-0 max-w-[360px] text-[13px] text-text-secondary">
            {error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-pill bg-accent-ashna px-4.5 py-2 text-[13px] font-semibold text-bg-primary"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;