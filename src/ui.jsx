const Icon = ({ name, size = 16, className = '', strokeWidth = 1.5, color = 'currentColor', style = {} }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
    'aria-hidden': true,
  };
  switch (name) {
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-up': return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...props}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'arrow-up-right': return <svg {...props}><path d="M7 17 17 7M8 7h9v9"/></svg>;
    case 'check': return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'x': return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus': return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'chevron-right': return <svg {...props}><path d="m9 18 6-6-6-6"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-left': return <svg {...props}><path d="m15 18-6-6 6-6"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>;
    case 'home': return <svg {...props}><path d="M3 12 12 3l9 9M5 10v10h14V10"/></svg>;
    case 'compass': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>;
    case 'chart': return <svg {...props}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
    case 'database': return <svg {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>;
    case 'zap': return <svg {...props}><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>;
    case 'file': return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'sparkles': return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'logout': return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'users': return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'building': return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>;
    case 'upload': return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
    case 'bell': return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'play': return <svg {...props}><polygon points="6 4 20 12 6 20 6 4"/></svg>;
    case 'pause': return <svg {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    case 'package': return <svg {...props}><path d="m7.5 4.27 9 5.15M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>;
    case 'flag': return <svg {...props}><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></svg>;
    case 'trending-up': return <svg {...props}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case 'trending-down': return <svg {...props}><path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>;
    case 'image': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'table': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>;
    case 'link': return <svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/></svg>;
    case 'mail': return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case 'lock': return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
    case 'circle': return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
    case 'circle-check': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'circle-dot': return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>;
    case 'alert': return <svg {...props}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>;
    case 'info': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>;
    case 'lightbulb': return <svg {...props}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.73c.92.94 1.5 1.94 1.5 3.27h5c0-1.33.58-2.33 1.5-3.27A7 7 0 0 0 12 2z"/></svg>;
    case 'panel-left': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>;
    case 'sliders': return <svg {...props}><path d="M3 6h13M16 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM3 12h5M8 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM12 12h9M3 18h13M16 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/></svg>;
    case 'filter': return <svg {...props}><path d="M3 4h18l-7 9v6l-4 2v-8z"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'download': return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case 'more': return <svg {...props}><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></svg>;
    case 'send': return <svg {...props}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>;
    case 'refresh': return <svg {...props}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'alert-circle': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>;
    case 'check-square': return <svg {...props}><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case 'help-circle': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
    case 'cloud': return <svg {...props}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
    case 'cloud-rain': return <svg {...props}><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>;
    case 'cloud-drizzle': return <svg {...props}><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>;
    case 'wind': return <svg {...props}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;
    case 'sun': return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
    case 'snowflake': return <svg {...props}><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 7-8 5-8-5M20 17l-8-5-8 5"/><path d="m2 12 4-2 4 2M14 12l4-2 4 2"/></svg>;
    case 'file-text': return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
    case 'credit-card': return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case 'google': return <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
// Icon component — message icon was wrong (showed a rectangle, not a chat bubble)
    case 'message': 
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    default: return null;
  }
};

const AtlasLogo = ({ size = 22 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#1c1917"/>
      <path d="M7 16 12 6l5 10M9 13h6" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em' }}>Atlas</span>
  </div>
);

const Delta = ({ value, suffix = '%', invert = false }) => {
  if (value === null || value === undefined) return null;
  const positive = invert ? value < 0 : value > 0;
    const color = value === 0 ? 'var(--ink-3)' : positive ? 'var(--positive)' : 'var(--negative)';
  const sign = value > 0 ? '+' : '';
  const display = Number.isInteger(value) ? Math.abs(value) : Math.abs(Math.round(value * 10) / 10);
  return (
    <span style={{ color, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {value !== 0 && <Icon name={value > 0 ? 'arrow-up' : 'arrow-down'} size={11} strokeWidth={2}/>}
      {sign}{display}{suffix}
    </span>
  );
};

const severityStyle = (s) => {
  switch (s) {
    case 'positive': return { color: 'var(--positive)', bg: 'var(--positive-soft)', icon: 'trending-up' };
    case 'warning':  return { color: 'var(--warning)',  bg: 'var(--warning-soft)',  icon: 'alert' };
    case 'negative': return { color: 'var(--negative)', bg: 'var(--negative-soft)', icon: 'trending-down' };
    case 'neutral':
    case 'info': default: return { color: 'var(--info)', bg: 'var(--info-soft)', icon: 'info' };
  }
};

const BizAvatar = ({ business, size = 32 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: 6,
    background: business?.color || '#4f46e5',
    color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    flexShrink: 0,
  }}>
    {business?.initials || '?'}
  </div>
);

const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '₹0';
  const num = Number(v);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  if (num >= 100000)   return '₹' + (num / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
const fmtCurrency = fmtINR;
const fmtNumber = (v) => v.toLocaleString('en-IN');

const SectionHeader = ({ eyebrow, title, subtitle, action = null }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 16 }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--ink-1)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

// ── Skeleton primitives ────────────────────────────────────────────────────────

/** A single shimmer line. width/height can be px numbers or CSS strings like '60%'. */
const SkeletonLine = ({ width = '100%', height = 12, radius = 4, style = {} }) => (
  <span
    className="skeleton"
    style={{ width, height, borderRadius: radius, display: 'block', ...style }}
  />
);

/** A circular shimmer placeholder (avatars, icons). */
const SkeletonCircle = ({ size = 32 }) => (
  <span
    className="skeleton"
    style={{ width: size, height: size, borderRadius: '50%', display: 'block', flexShrink: 0 }}
  />
);

// ── Skeleton composites ────────────────────────────────────────────────────────

/**
 * Mimics a MetricTile card (label · big number · delta).
 * Matches the exact layout of the real MetricTile component.
 */
const SkeletonMetricTile = () => (
  <div className="card" style={{ padding: 16, minHeight: 110, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {/* label row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonLine width="55%" height={11} />
      <SkeletonLine width={14} height={14} radius={3} />
    </div>
    {/* big value */}
    <SkeletonLine width="72%" height={26} radius={4} />
    {/* delta + period */}
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
      <SkeletonLine width="32%" height={11} />
      <SkeletonLine width="24%" height={11} />
    </div>
  </div>
);

/**
 * Mimics an InsightCard (severity badge · title · body · evidence tags).
 */
const SkeletonInsightCard = () => (
  <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {/* severity badge row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SkeletonLine width={22} height={22} radius={5} />
      <SkeletonLine width="30%" height={10} />
    </div>
    {/* title */}
    <SkeletonLine width="85%" height={14} radius={3} />
    <SkeletonLine width="60%" height={14} radius={3} style={{ marginTop: -4 }} />
    {/* body lines */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="90%"  height={12} />
      <SkeletonLine width="70%"  height={12} />
    </div>
    {/* footer: tags + button */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <SkeletonLine width={52} height={20} radius={999} />
        <SkeletonLine width={64} height={20} radius={999} />
        <SkeletonLine width={44} height={20} radius={999} />
      </div>
      <SkeletonLine width={68} height={28} radius={6} />
    </div>
  </div>
);

/**
 * Mimics an ActionCard (icon · title · body · impact/effort/confidence grid · buttons).
 */
const SkeletonActionCard = () => (
  <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
    {/* title row */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <SkeletonLine width={22} height={22} radius={5} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
        <SkeletonLine width="80%" height={14} />
        <SkeletonLine width="55%" height={14} />
      </div>
    </div>
    {/* body lines */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="85%"  height={12} />
    </div>
    {/* impact / effort / confidence grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonLine width="60%" height={9} />
          <SkeletonLine width="45%" height={13} />
        </div>
      ))}
    </div>
    {/* action buttons */}
    <div style={{ display: 'flex', gap: 8 }}>
      <SkeletonLine style={{ flex: 1 }} height={32} radius={6} />
      <SkeletonLine width={96} height={32} radius={6} />
      <SkeletonLine width={32} height={32} radius={6} />
    </div>
  </div>
);

/**
 * A single shimmer table row — use multiple to fill a list.
 * `cols` is an array of widths for each cell, e.g. ['40%', '20%', '20%', 80]
 */
const SkeletonTableRow = ({ cols = ['50%', '25%', '15%'], height = 48, last = false }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '0 18px',
    height,
    borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
  }}>
    {cols.map((w, i) => (
      <SkeletonLine key={i} width={w} height={12} style={i > 0 ? { marginLeft: 'auto' } : {}} />
    ))}
  </div>
);

/**
 * A shimmer block that stands in for a chart area.
 * Renders a subtle wave pattern to imply "graph loading".
 */
const logError = (prefix, error) => {
  console.error(`${prefix}:`, error);
  // Could add Sentry/telemetry here
};

const SkeletonChart = ({ height = 180 }) => (
  <div
    className="skeleton"
    style={{ width: '100%', height, borderRadius: 8, position: 'relative', overflow: 'hidden' }}
  >
    {/* faint bar silhouettes so it reads as "chart" not just a blank box */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 8px 8px' }}>
      {[55, 72, 48, 83, 62, 91, 70, 58, 76, 65, 88, 74].map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            borderRadius: '3px 3px 0 0',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
    </div>
  </div>
);

export {
  Icon, AtlasLogo, Delta, BizAvatar,
  fmtINR, fmtCurrency, fmtNumber,
  SectionHeader, severityStyle,
  logError,
  // Skeleton primitives
  SkeletonLine, SkeletonCircle,
  // Skeleton composites
  SkeletonMetricTile, SkeletonInsightCard, SkeletonActionCard,
  SkeletonTableRow, SkeletonChart,
};
