import React from 'react';
import { captureError } from './telemetry';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    captureError(error, { componentStack: errorInfo?.componentStack });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 32,
          textAlign: 'center',
          color: 'var(--ink-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          margin: 16,
          background: 'var(--bg-elevated)'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
            {this.state.error?.toString() || 'An unexpected error occurred'}
          </div>
          <button className="btn btn-sm" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
