import React from 'react';
import { Icon } from './ui';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Atlas Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--bg)', color: 'var(--ink-2)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Icon name="x" size={24} color="var(--negative)"/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
            Atlas encountered an unexpected API connection drop or UI error.
          </div>
          <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--ink-4)', maxWidth: 500, width: '100%', overflow: 'auto', fontFamily: 'var(--font-mono)' }}>
            {this.state.error?.toString()}
          </div>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 32 }} onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Reload Atlas
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}
