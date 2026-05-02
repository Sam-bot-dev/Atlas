// src/components/LoadingStates.jsx

export const MetricSkeleton = () => (
  <div
    className="card"
    style={{
      height: '80px',
      background: 'var(--bg-subtle)',
      animation: 'pulse 2s infinite',
    }}
  />
);

export const MetricsGridSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <MetricSkeleton key={i} />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div
    className="card"
    style={{
      height: '120px',
      background: 'var(--bg-subtle)',
      animation: 'pulse 2s infinite',
    }}
  />
);

export const InsightsGridSkeleton = () => (
  <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--bg-subtle)',
        borderTop: '3px solid var(--brand)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
      }}
    />
    <p style={{ color: 'var(--ink-3)' }}>{message}</p>
  </div>
);

export const EmptyState = ({ icon = '📭', title = 'No data', description = 'Nothing to show yet' }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: 'var(--bg-subtle)',
      borderRadius: 'var(--radius-lg)',
    }}
  >
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
    <h3 style={{ color: 'var(--ink-1)', marginBottom: '8px' }}>{title}</h3>
    <p style={{ color: 'var(--ink-3)', fontSize: '14px' }}>{description}</p>
  </div>
);

// Global CSS for animations (add to styles.css)
export const animationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
