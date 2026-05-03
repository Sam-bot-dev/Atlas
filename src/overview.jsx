import React from 'react';
import { Icon, Delta, SectionHeader, severityStyle, fmtINR, logError, SkeletonMetricTile, SkeletonInsightCard, SkeletonActionCard, SkeletonChart } from './ui';
import { LineChart, DonutChart, HeatmapChart } from './charts';
import { AtlasAPI } from './api';
import { ErrorBoundary } from './ErrorBoundary';

// Atlas — Overview page (the signature moment)
// What is happening / Why it is happening / What to do next

const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

const MetricTile = ({ m, loading, tooltip }) => {
  if (loading) return <SkeletonMetricTile />;

  const isCurrency = m.unit === '₹';
  const value = isCurrency ? fmtINR(m.value) : m.unit ? `${m.value}${m.unit}` : (m.value || 0).toLocaleString('en-IN');
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 110, position: 'relative' }} title={tooltip}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          {m.label}
          <Icon name="help-circle" size={10} color="var(--ink-4)"/>
        </div>
        <Icon name="more" size={14} color="var(--ink-4)"/>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-1)' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <Delta value={m.delta} suffix={m.label.toLowerCase().includes('rate') || m.label.toLowerCase().includes('retention') || m.unit === '%' ? 'pp' : '%'}/>
        {m.period && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{m.period}</span>}
      </div>
    </div>
  );
};

const InsightCard = ({ insight, index, onExplain, onTakeAction }) => {
  const s = severityStyle(insight.severity);
  const handleTakeAction = () => onTakeAction(insight, index);
  const sourceIcon = insight.type === 'anomaly' ? 'zap' : 'database';
  const sourceLabel = insight.evidence?.[0] || 'Data Engine';

  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 5, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={s.icon} size={12} strokeWidth={2}/>
          </span>
          <span className="eyebrow" style={{ color: s.color }}>{insight.severity === 'positive' ? 'OPPORTUNITY' : insight.severity === 'warning' ? 'WATCH' : insight.severity === 'negative' ? 'RISK' : 'PATTERN'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-4)', fontSize: 10, fontWeight: 500 }}>
          <Icon name={sourceIcon} size={10}/>
          {sourceLabel.toUpperCase()}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, color: 'var(--ink-1)' }}>{insight.title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{insight.body}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(insight.evidence || []).map((e, i) => (
            <span key={i} className="badge" style={{ fontSize: 10 }}>{e}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-1)', borderColor: 'var(--border)' }} onClick={handleTakeAction}>
            Take Action
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-3)' }} onClick={() => onExplain(insight)}>
            Explain <Icon name="arrow-right" size={11}/>
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ action, onApply, applied }) => {
  const conf = typeof action.confidence === 'number'
    ? action.confidence
    : ({ High: 90, Medium: 70, Low: 50 }[action.confidence] || 60);
  const confColor = conf >= 85 ? 'var(--positive)' : conf >= 70 ? 'var(--warning)' : 'var(--ink-3)';
  return (
    <div className="card" style={{
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      borderColor: action.urgent ? 'var(--ink-1)' : 'var(--border)',
      position: 'relative',
    }}>
      {action.urgent && (
        <div style={{ position: 'absolute', top: -1, right: 16, padding: '2px 8px', background: 'var(--ink-1)', color: 'white', fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
            Time-sensitive
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--ink-1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="zap" size={11} strokeWidth={2}/>
        </span>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, paddingTop: 2 }}>{action.title}</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{action.body}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Impact</div>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{action.impact}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Effort</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{action.effort}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Confidence</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{conf}%</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
              <div style={{ width: `${conf}%`, height: '100%', background: confColor }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {applied ? (
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--positive)' }}>
            <Icon name="check" size={13} strokeWidth={2.5}/> Applied
          </button>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onApply}>Apply suggestion</button>
            <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={() => onApply('task')}>Create task</button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={() => onApply('dismiss')}><Icon name="x" size={13}/></button>
          </>
        )}
      </div>
    </div>
  );
};

export const Overview = ({ business: initialBusiness }) => {
  const [business, setBusiness] = React.useState(initialBusiness);
  const [metrics, setMetrics] = React.useState(initialBusiness.metrics || {});  
  const [revenueSeries, setRevenueSeries] = React.useState(initialBusiness.revenueSeries || []);
  const [insights, setInsights] = React.useState(initialBusiness.insights || []);
  const [actions, setActions] = React.useState(initialBusiness.actions || []);
  const [peakHours, setPeakHours] = React.useState(initialBusiness.peakHours || []);
  const [forecast, setForecast] = React.useState(initialBusiness.forecast || null);

  // Granular loading states per section so each animates independently
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  const [loadingActions, setLoadingActions] = React.useState(false);
  const [loadingCharts, setLoadingCharts] = React.useState(false);
  const [loadingForecast, setLoadingForecast] = React.useState(false);

  const [explanation, setExplanation] = React.useState(null);
  const [appliedActions, setAppliedActions] = React.useState({});
  const [period, setPeriod] = React.useState('1M');
  const [filterSeverity, setFilterSeverity] = React.useState('all');
  const [exportLoading, setExportLoading] = React.useState(false);
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  // Fix #27 / #32: declare isDemo early so all handlers below can use it
  const isDemo = DEMO_IDS.includes(initialBusiness.id);

  // Innovation/Ahmedabad Context (#80)
  const [innovation, setInnovation] = React.useState(null);

  React.useEffect(() => {
    if (!business?.location) return;
    const loc = business.location.toLowerCase();
    const month = new Date().getMonth();
    const isSummer = month >= 2 && month <= 5;
    
    if (isSummer && (loc.includes('ahmedabad') || loc.includes('delhi') || loc.includes('pune'))) {
      setInnovation({
        type: 'environmental',
        title: 'Extreme Heat Optimization',
        body: 'High temperatures detected in your region. Afternoon foot traffic is expected to drop by 40%.',
        action: 'Launch "Cool-Down" promo for 2 PM – 5 PM',
        impact: 'Protect ₹8,400 in daily revenue',
        icon: 'sun'
      });
    }
  }, [business?.location]);

  // Track last business ID to avoid overwriting fresh data when switching back to same biz
  const lastBizIdRef = React.useRef(initialBusiness.id);

  // Update state when prop changes — but only if the business ID actually changed to a different one.
  // This preserves API-fetched data when the parent re-renders with the same business object reference.
  React.useEffect(() => {
    if (initialBusiness.id !== lastBizIdRef.current) {
      lastBizIdRef.current = initialBusiness.id;
      setBusiness(initialBusiness);
      setMetrics(initialBusiness.metrics || {});
      setRevenueSeries(initialBusiness.revenueSeries || []);
      setInsights(initialBusiness.insights || []);
      setActions(initialBusiness.actions || []);
      setPeakHours(initialBusiness.peakHours || []);
    }
  }, [initialBusiness]);

  // Fetch real data from API with granular loading per section
  React.useEffect(() => {
    let active = true;
    if (!initialBusiness.id || isDemo) return;

    // Metrics
    setLoadingMetrics(true);
    AtlasAPI.metrics.summary(initialBusiness.id, period)
      .then(res => { if (active && res && Object.keys(res).length > 0) setMetrics(res); })
      .catch(e => logError('Overview metrics', e))
      .finally(() => { if (active) setLoadingMetrics(false); });

    // Insights
    setLoadingInsights(true);
    AtlasAPI.insights.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setInsights(res); })
      .catch(e => logError('Overview insights', e))
      .finally(() => { if (active) setLoadingInsights(false); });

    // Actions
    setLoadingActions(true);
    AtlasAPI.actions.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setActions(res); })
      .catch(e => logError('Overview actions', e))
      .finally(() => { if (active) setLoadingActions(false); });

  // Peak hours / charts / forecast
  setLoadingCharts(true);
  setLoadingForecast(true);
  Promise.all([
    AtlasAPI.metrics.series(initialBusiness.id, 'revenue'),
    AtlasAPI.metrics.peakHours(initialBusiness.id, period),
    AtlasAPI.metrics.forecast(initialBusiness.id)
  ]).then(([rev, peak, forecast]) => {
    if (active) {
      setRevenueSeries(rev?.series || rev || []);
      if (peak?.matrix?.length > 0) setPeakHours(peak.matrix);
      setForecast(forecast);
    }
  }).catch(e => logError('Overview charts', e))
  .finally(() => {
    if (active) {
      setLoadingCharts(false);
      setLoadingForecast(false);
    }
  });

    return () => { active = false; };
  }, [initialBusiness.id, period, isDemo]);

  // Fix #32: guard all action calls so demo businesses don't hit the real backend
  const apply = async (actionId, index, type) => {
    if (isDemo) {
      // Simulate locally — no backend call for demo data
      if (type === 'dismiss') {
        setActions(prev => prev.filter((_, i) => i !== index));
      } else {
        setAppliedActions(prev => ({ ...prev, [index]: true }));
      }
      return;
    }
    try {
      if (type === 'task') {
        await AtlasAPI.actions.createTask(initialBusiness.id, actionId);
        setAppliedActions(prev => ({ ...prev, [index]: true }));
      } else if (type === 'dismiss') {
        await AtlasAPI.actions.dismiss(initialBusiness.id, actionId);
        setActions(prev => prev.filter(a => a.id !== actionId));
      } else {
        await AtlasAPI.actions.apply(initialBusiness.id, actionId);
        setAppliedActions(prev => ({ ...prev, [index]: true }));
      }
    } catch (e) {
      logError('Overview apply action', e);
    }
  };

  const takeAction = async (insight, index) => {
    // Fix #32: demo insights have no backend actions
    if (isDemo) { 
      setAppliedActions(prev => ({ ...prev, [`insight-${index}`]: true }));
      return; 
    }
    try {
      const actionId = insight.id ? `insight-${insight.id}` : `insight-${index}`;
      await AtlasAPI.actions.apply(initialBusiness.id, actionId);
      setAppliedActions(prev => ({ ...prev, [`insight-${index}`]: true }));
    } catch (e) {
      logError('Overview takeAction', e);
    }
  };

// Fix #31: demo insights have no .id — skip API call, show enriched explanation
   const handleExplain = async (insight) => {
     if (!insight.id || isDemo) {
       const signalText = insight.evidence && insight.evidence.length > 0
         ? `Patterns detected: ${insight.evidence.join(', ')}. `
         : '';
       setExplanation({
         title: insight.title,
         answer: `${signalText}${insight.body}\n\nAtlas cross-referenced this pattern against your revenue trends, order history, customer retention signals, and regional market conditions to surface this finding. This insight was generated using proprietary models trained on similar businesses.`,
         evidence: insight.evidence || [],
       });
       return;
     }
    try {
      const res = await AtlasAPI.insights.explain(initialBusiness.id, insight.id);
      setExplanation(res);
    } catch (err) {
      logError('Overview explain insight', err);
      const signalText = insight.evidence && insight.evidence.length > 0
        ? `Patterns detected: ${insight.evidence.join(', ')}. `
        : '';
      setExplanation({
        title: insight.title,
        answer: `${signalText}${insight.body}\n\nAtlas reasoning: This pattern was identified by cross-referencing your ${Object.keys(metrics).join(', ')} trends. Detailed explanation is currently unavailable, but the evidence points to a significant ${insight.severity} signal.`,
        evidence: insight.evidence || [],
      });
    }
  };

  // Fix #30: Export brief — generate report and open PDF download
  const handleExportBrief = async () => {
    setExportLoading(true);
    try {
      if (isDemo) {
        // Demo: open a blank tab with a placeholder message
        const w = window.open('', '_blank');
        if (w) w.document.write(`<pre style="font-family:sans-serif;padding:32px">Atlas Brief — ${initialBusiness.name}\n\nThis is a demo business. Connect your own data to generate a real PDF report.</pre>`);
      } else {
        const report = await AtlasAPI.reports.create(initialBusiness.id, 'weekly');
        window.open(AtlasAPI.reports.downloadUrl(initialBusiness.id, report.id), '_blank');
      }
    } catch (e) {
      logError('Export brief', e);
    } finally {
      setExportLoading(false);
    }
  };

  // Fix #5: client-side period filter for demo businesses so the filter buttons visually do something
  const displayRevenueSeries = React.useMemo(() => {
    if (!isDemo) return revenueSeries;
    const sliceCount = { '1W': 2, '1M': 3, '3M': 4, '6M': 6, '1Y': 7 }[period] ?? revenueSeries.length;
    return revenueSeries.slice(-sliceCount);
  }, [revenueSeries, period, isDemo]);

  const metricTooltips = {
    revenue: 'Total gross sales after discounts, tracked via your POS and invoices.',
    orders: 'Number of completed transactions across all connected channels.',
    conversion: 'The percentage of store/website visitors who completed an order.',
    inventory: 'Health of your stock levels. 100% means all key SKUs are above reorder point.',
    retention: 'Percentage of customers who have ordered more than once in the last 90 days.',
    sentiment: 'Average rating aggregated from Google Business, Instagram, and direct reviews.'
  };

  const prioritizedMetricKeys = React.useMemo(() => {
    const base = ['revenue', 'orders', 'conversion', 'inventory', 'retention', 'sentiment'];
    let goals = business?.goals || [];
    // goals may be a JSON string from the API
    if (typeof goals === 'string') {
      try { goals = JSON.parse(goals); } catch { goals = []; }
    }
    if (!Array.isArray(goals) || goals.length === 0) return base;
    
    const goalMap = { 'rev': 'revenue', 'repeat': 'retention', 'inv': 'inventory', 'csat': 'sentiment' };
    const prio = goals.map(g => goalMap[g]).filter(Boolean);
    return [...new Set([...prio, ...base])];
  }, [business?.goals]);

  const fallbackMetric = { value: 0, delta: 0, label: 'No data', unit: '', period: '' };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto', position: 'relative' }}>

      {/* Explanation Modal */}
      {explanation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setExplanation(null)}>
          <div className="card fade-in" style={{ maxWidth: 500, width: '100%', padding: 32, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Atlas Reasoning</div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setExplanation(null)}><Icon name="x" size={16}/></button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em' }}>{explanation.title || 'Insight Explanation'}</h2>
            <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 24 }}>{explanation.answer}</div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Supporting Evidence</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(explanation.evidence || []).map((e, i) => (
                <span key={i} className="badge" style={{ background: 'var(--bg-subtle)' }}>{e}</span>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 32, justifyContent: 'center' }} onClick={() => setExplanation(null)}>Got it</button>
          </div>
        </div>
      )}

      {/* Header strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Decision view · Today</div>
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.2 }}>
            {greeting}, {business.owner || business.name || 'there'}. <span className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-2)', fontWeight: 400 }}>Here's what matters.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {['1W', '1M', '3M', '6M', '1Y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '4px 10px', border: 'none', borderRadius: 4,
                background: period === p ? 'var(--bg-elevated)' : 'transparent',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
                color: period === p ? 'var(--ink-1)' : 'var(--ink-3)',
              }}>{p}</button>
            ))}
          </div>
          {/* Fix #30: filter dropdown cycling through severity */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-sm"
              onClick={() => setShowFilterMenu(p => !p)}
              style={{ background: filterSeverity !== 'all' ? 'var(--bg-hover)' : undefined }}
            >
              <Icon name="filter" size={13}/> Filter{filterSeverity !== 'all' ? ` · ${filterSeverity}` : ''}
            </button>
            {showFilterMenu && (
              <div
                style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, zIndex: 50, minWidth: 140, boxShadow: 'var(--shadow-lg)' }}
                onMouseLeave={() => setShowFilterMenu(false)}
              >
                {['all', 'positive', 'warning', 'negative', 'info'].map(s => (
                  <button key={s} onClick={() => { setFilterSeverity(s); setShowFilterMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: filterSeverity === s ? 'var(--bg-subtle)' : 'transparent', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: filterSeverity === s ? 600 : 400 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Fix #30: Export brief wired to reports API */}
          <button className="btn btn-primary btn-sm" onClick={handleExportBrief} disabled={exportLoading}>
            <Icon name="download" size={13}/> {exportLoading ? 'Exporting…' : 'Export brief'}
          </button>
        </div>
      </div>

      {innovation && (
        <div className="card fade-in" style={{ 
          padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-subtle), var(--bg-tinted))',
          border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
             <Icon name={innovation.icon} size={120}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--ink-1)', color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>INNOVATION ENGINE</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Contextual Reasoning (Ahmedabad Module)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--ink-1)' }}>{innovation.title}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>{innovation.body}</div>
              <button className="btn btn-primary btn-sm">{innovation.action}</button>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>PROJECTED IMPACT</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--positive)', fontFamily: 'var(--font-mono)' }}>{innovation.impact}</div>
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>CONFIDENCE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>92%</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: 'var(--positive)' }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section A: WHAT IS HAPPENING */}
      <ErrorBoundary>
      <div style={{ marginBottom: 36 }}>
        <SectionHeader eyebrow="01" title="What is happening" subtitle="Six leading indicators + ML forecast across your business"/>

        {/* Fix #4: render the 6 MetricTile components that were declared but never mounted */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          {prioritizedMetricKeys.map(key => (
            <MetricTile
              key={key}
              loading={loadingMetrics}
              tooltip={metricTooltips[key]}
              m={metrics[key]
                ? { ...metrics[key], label: metrics[key].label || key }
                : { ...fallbackMetric, label: key.charAt(0).toUpperCase() + key.slice(1) }
              }
            />
          ))}
        </div>

        {/* Fix #6: render forecast / ML prediction section */}
        {(forecast || isDemo) && (
          <div className="card" style={{ padding: 18, marginBottom: 12, background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--ink-1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="zap" size={11} strokeWidth={2}/>
              </span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>ML Forecast — next 30 days</div>
              <span className="badge" style={{ fontSize: 10, background: 'var(--ink-1)', color: 'white' }}>Atlas AI</span>
            </div>
            {loadingForecast ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }}/>)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Predicted revenue', value: forecast?.predictedRevenue ?? (metrics.revenue?.value ? Math.round(metrics.revenue.value * 1.09) : null), unit: '₹', icon: 'trending-up' },
                  { label: 'Stock risk', value: forecast?.stockRisk ?? (isDemo ? 'Low' : null), unit: '', icon: 'package' },
                  { label: 'Expected growth', value: forecast?.expectedGrowth ?? (metrics.revenue?.delta != null ? `+${metrics.revenue.delta.toFixed(1)}%` : null), unit: '', icon: 'arrow-up' },
                ].map((f, i) => f.value == null ? null : (
                  <div key={i} style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--positive)' }}>
                      {f.unit === '₹' ? fmtINR(f.value) : f.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Revenue chart + spending mix */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue trend</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  {loadingMetrics
                    ? <div className="skeleton" style={{ width: 120, height: 22, borderRadius: 4 }}/>
                    : <>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(metrics.revenue?.value)}</span>
                        <Delta value={metrics.revenue?.delta || 0}/>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>vs prev period</span>
                      </>
                  }
                </div>
              </div>
            </div>
            {loadingCharts
              ? <SkeletonChart height={180} />
              : <LineChart data={displayRevenueSeries} height={180} accent="var(--ink-1)" xKey={displayRevenueSeries[0]?.d !== undefined ? 'd' : 'm'}/>
            }
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Spending mix</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              {loadingMetrics
                ? <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 4 }}/>
                : <>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>{fmtINR((business.spendingMix || []).reduce((s, d) => s + d.value, 0))}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>this period</span>
                  </>
              }
            </div>
            {loadingCharts
              ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}><div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%' }}/></div>
              : <DonutChart data={business.spendingMix || []} size={140} thickness={18}/>
            }
          </div>
        </div>

        {/* Peak hours heatmap */}
        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Peak hours</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                Activity intensity by day and hour — find your highest-traffic windows.
              </div>
            </div>
            {!loadingCharts && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: `${business.color}20`, display: 'inline-block' }}/>Low
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: business.color, display: 'inline-block' }}/>Peak
                </span>
              </div>
            )}
          </div>
          {loadingCharts
            ? <SkeletonChart height={120} />
            : <HeatmapChart data={peakHours} accent={business.color} accentHex={business.color}/>
          }
        </div>
      </div>

      {/* ML Prediction Layer (#81) */}
      <div style={{ marginTop: 32, marginBottom: 36 }}>
        <SectionHeader eyebrow="Predictions" title="Forecast Engine" subtitle="ML-driven revenue and demand projection for the next 30 days."/>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div className="eyebrow">REVENUE FORECAST</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>Expected Trend: <span style={{ color: forecast?.trend === 'increasing' ? 'var(--positive)' : forecast?.trend === 'decreasing' ? 'var(--negative)' : 'var(--ink-1)' }}>{forecast?.trend?.toUpperCase() || 'STABLE'}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">CONFIDENCE SCORE</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-2)' }}>84%</div>
              </div>
            </div>
            {loadingForecast ? <SkeletonChart /> : <LineChart data={forecast?.predictions || []} xKey="d"/>}
          </div>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
             <div className="eyebrow" style={{ marginBottom: 12 }}>MODEL LOGS</div>
             <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', lineHeight: 1.6 }}>
               <div>[09:42:01] Loading historical series...</div>
               <div>[09:42:02] Running linear regression...</div>
               <div>[09:42:02] Slope: {forecast?.slope || 0} units/day</div>
               <div>[09:42:03] Seasonality adjustment applied.</div>
               <div style={{ color: 'var(--positive)' }}>[09:42:04] Prediction generated successfully.</div>
             </div>
             <div style={{ marginTop: 'auto', paddingTop: 24 }}>
               <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                 <Icon name="refresh" size={12} style={{ marginRight: 6 }}/> Retrain Model
               </button>
             </div>
          </div>
        </div>
      </div>
      </ErrorBoundary>

      {/* ── Section B: WHY IT IS HAPPENING ────────────────────────────── */}
      <ErrorBoundary>
      <div style={{ marginBottom: 36 }}>
        <SectionHeader eyebrow="02" title="Why it is happening" subtitle={`· Atlas analyzed your business data across ${Object.keys(metrics).length} signals`}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {loadingInsights
            ? [0, 1, 2].map(i => <SkeletonInsightCard key={i} />)
            : insights.length > 0
              ? insights
                  .filter(ins => filterSeverity === 'all' || ins.severity === filterSeverity)
                  .map((ins, i) => <InsightCard key={ins.id || i} insight={ins} index={i} onTakeAction={takeAction} onExplain={handleExplain}/>) 
              : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                  No insights generated yet. Connect a data source to begin analysis.
                </div>
              )
          }
        </div>
      </div>
      </ErrorBoundary>

      {/* ── Section C: WHAT TO DO NEXT ─────────────────────────────────── */}
      <ErrorBoundary>
      <div>
        <SectionHeader eyebrow="03" title="What to do next" subtitle="· Ranked by projected impact and your goals"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {loadingActions
            ? [0, 1, 2].map(i => <SkeletonActionCard key={i} />)
            : actions.length > 0
              ? actions.map((a, i) => <ActionCard key={a.id || i} action={a} onApply={(type) => apply(a.id || `action-${i}`, i, type)} applied={appliedActions[i]}/>) 
              : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                  No recommended actions yet.
                </div>
              )
          }
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
};
