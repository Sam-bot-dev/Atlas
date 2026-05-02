// src/components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--bg-tinted)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-strong)',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ color: 'var(--ink-1)', marginBottom: '10px' }}>
            ⚠️ Something went wrong
          </h3>
          <p style={{ color: 'var(--ink-3)', marginBottom: '20px', fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div
    style={{
      padding: '30px',
      textAlign: 'center',
      background: 'var(--bg-tinted)',
      borderRadius: 'var(--radius-md)',
      border: '2px solid var(--negative-soft)',
    }}
  >
    <h4 style={{ color: 'var(--negative)' }}>Failed to load</h4>
    <p style={{ color: 'var(--ink-3)', fontSize: '12px', marginBottom: '15px' }}>
      {error?.message || 'Unknown error'}
    </p>
    <button className="btn btn-sm" onClick={resetErrorBoundary}>
      Try Again
    </button>
  </div>
);
