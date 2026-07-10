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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
            background: 'var(--color-bg-primary)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: 'var(--color-text-primary)', fontSize: '18px', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '360px', margin: 0 }}>
            {error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--color-accent-ashna)',
              color: '#0B0F19',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
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