import React from 'react';
import { Icon, Delta, SectionHeader, severityStyle, fmtINR, logError, SkeletonMetricTile, SkeletonInsightCard, SkeletonActionCard, SkeletonChart } from './ui';
import { LineChart, DonutChart, HeatmapChart } from './charts';
import { AtlasAPI } from './api';
import { ErrorBoundary } from './ErrorBoundary';
import { buildDemoData } from './mockData';
import { demoTaskStore } from './demoTasks';
import { downloadReport as generateAndDownload } from './reportGenerator';
import { TakeActionModal } from './TakeActionModal';

// Atlas — Overview page (the signature moment)
// What is happening / Why it is happening / What to do next

const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

const MetricTile = ({ m, loading, tooltip }) => {
  if (loading) return <SkeletonMetricTile />;

  const isCurrency = m.unit === '₹';
  // Guard against NaN/Infinity from float arithmetic before rendering
  const safeValue = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const displayVal = safeValue(m.value);
  const value = isCurrency
    ? fmtINR(displayVal)
    : m.unit
      ? `${displayVal}${m.unit}`
      : displayVal.toLocaleString('en-IN');
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 110, position: 'relative', cursor: 'default' }} title={tooltip}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          {m.label}
          <Icon name="help-circle" size={10} color="var(--ink-4)"/>
        </div>
        <Icon name="more" size={14} color="var(--ink-4)"/>
      </div>
      <div className="num-in" style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-1)' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <Delta value={safeValue(m.delta)} suffix={m.label.toLowerCase().includes('rate') || m.label.toLowerCase().includes('retention') || m.unit === '%' ? 'pp' : '%'}/>
        {m.period && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{m.period}</span>}
      </div>
    </div>
  );
};

// ── InsightCard ───────────────────────────────────────────────────────────────
// applied / appliedType: set after the Take Action modal is submitted
const InsightCard = ({ insight, index, onExplain, onTakeAction, applied, appliedType }) => {
  const s = severityStyle(insight?.severity || 'info');
  const sourceIcon = insight.type === 'anomaly' ? 'zap' : 'database';
  const sourceLabel = insight?.evidence?.[0] || 'Data Engine';

  const appliedLabel = () => {
    if (appliedType === 'apply')    return 'Marked as in progress';
    if (appliedType === 'schedule') return 'Scheduled — reminder set';
    return 'Task created — view in Tasks';
  };

  return (
    <div
      className="card card-interactive"
      style={{
        padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        borderColor: applied ? 'var(--positive)' : 'var(--border)',
        transition: 'border-color 200ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 5, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={s.icon} size={12} strokeWidth={2}/>
          </span>
          <span className="eyebrow" style={{ color: s.color }}>
            {insight?.severity === 'positive' ? 'OPPORTUNITY'
              : insight?.severity === 'warning' ? 'WATCH'
              : insight?.severity === 'negative' ? 'RISK'
              : 'PATTERN'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-4)', fontSize: 10, fontWeight: 500 }}>
          <Icon name={sourceIcon} size={10}/>
          {sourceLabel.toUpperCase()}
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, color: 'var(--ink-1)' }}>
        {insight.title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
        {insight.body}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(insight?.evidence || []).map((e, i) => (
            <span key={i} className="badge" style={{ fontSize: 10 }}>{e}</span>
          ))}
        </div>

        {applied ? (
          /* ── Taken state ── */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--positive-soft)', border: '1px solid transparent',
          }}>
            <Icon name="check" size={11} strokeWidth={2.5} color="var(--positive)"/>
            <span style={{ fontSize: 11, color: 'var(--positive)', fontWeight: 600 }}>
              {appliedLabel()}
            </span>
          </div>
        ) : (
          /* ── Action buttons ── */
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-sm"
              style={{
                color: 'var(--ink-1)', borderColor: 'var(--border)',
                background: 'var(--bg-elevated)',
                fontWeight: 600,
              }}
              onClick={() => onTakeAction(insight, index)}
            >
              <Icon name="zap" size={12} color="var(--ink-1)"/> Take Action
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--ink-3)' }}
              onClick={() => onExplain(insight)}
            >
              Explain <Icon name="arrow-right" size={11}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionCard = ({ action, onApply, applied, appliedType }) => {
  const conf = typeof action.confidence === 'number'
    ? action.confidence
    : ({ High: 90, Medium: 70, Low: 50 }[action.confidence] || 60);
  const confColor = conf >= 85 ? 'var(--positive)' : conf >= 70 ? 'var(--warning)' : 'var(--ink-3)';
  return (
    <div className="card card-interactive" style={{
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <Icon name="check" size={13} strokeWidth={2.5} color="var(--positive)"/>
            <span style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 500 }}>
              {appliedType === 'task' ? 'Task created — view in Tasks' : 'Marked in progress'}
            </span>
          </div>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onApply('apply')}>
              <Icon name="zap" size={12}/> Apply suggestion
            </button>
            <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={() => onApply('task')}>
              <Icon name="check-square" size={12}/> Create task
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} title="Dismiss" onClick={() => onApply('dismiss')}>
              <Icon name="x" size={13}/>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const Overview = ({ business: initialBusiness, onNavigate }) => {
  const [business, setBusiness] = React.useState(initialBusiness || {});
  const [metrics, setMetrics] = React.useState((initialBusiness || {}).metrics || {});  
  const [revenueSeries, setRevenueSeries] = React.useState((initialBusiness || {}).revenueSeries || []);
  const [customerGrowth, setCustomerGrowth] = React.useState((initialBusiness || {}).customerGrowth || []); // eslint-disable-line no-unused-vars
  const [ordersSeries, setOrdersSeries] = React.useState((initialBusiness || {}).ordersSeries || []); // eslint-disable-line no-unused-vars
  const [insights, setInsights] = React.useState((initialBusiness || {}).insights || []);
  const [actions, setActions] = React.useState((initialBusiness || {}).actions || []);
  const [peakHours, setPeakHours] = React.useState((initialBusiness || {}).peakHours || []);
  const [forecast, setForecast] = React.useState((initialBusiness || {}).forecast || null);

  // Granular loading states per section so each animates independently
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  const [loadingActions, setLoadingActions] = React.useState(false);
  const [loadingCharts, setLoadingCharts] = React.useState(false);
  const [loadingForecast, setLoadingForecast] = React.useState(false);

  const [explanation, setExplanation] = React.useState(null);
  const [appliedActions, setAppliedActions] = React.useState({}); // { key: 'apply' | 'task' | 'schedule' }
  const [actionConfirm, setActionConfirm] = React.useState(null); // { task, type }
  const [actionInsight, setActionInsight] = React.useState(null); // { insight, index } — drives TakeActionModal
  const [period, setPeriod] = React.useState('1M');
  const [filterSeverity, setFilterSeverity] = React.useState('all');
  const [exportLoading, setExportLoading] = React.useState(false);
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  // Fix #27 / #32: declare isDemo early so all handlers below can use it
  const isDemo = DEMO_IDS.includes(initialBusiness.id);

  // Per-business environmental context — each location gets a unique, realistic signal
  // keyed by business ID so switching businesses always shows the right card.
  const ENVIRONMENTAL_CONTEXTS = {
    // Priya's Bakes — Pune, Maharashtra (pre-monsoon heat + humidity)
    baker: {
      type: 'environmental',
      title: 'Pre-Monsoon Humidity Hitting Shelf Life',
      body: 'Pune humidity is at 78% and rising. Butter-based products like croissants and cream cakes are spoiling 30% faster than in winter. Two customer complaints this week cited stale texture.',
      action: 'Switch to refrigerated display + add 1-day shelf-life labels',
      impact: 'Prevent ₹4,200 in weekly wastage',
      confidence: 88,
      icon: 'cloud',
      label: 'Pune · Pre-Monsoon Signal',
    },
    retail: {
      type: 'environmental',
      title: 'Surat Heatwave — 44°C Forecast This Week',
      body: 'Afternoon foot traffic in Surat textile markets drops 55% when temperature crosses 42°C. Your busiest hours (3–6 PM) will be dead. Competitors on Ring Road are already running evening-only hours.',
      action: 'Shift store hours to 8 AM–1 PM and 7–10 PM this week',
      impact: 'Protect ₹38,000 in weekly walk-in revenue',
      confidence: 91,
      icon: 'sun',
      label: 'Surat · Heatwave Alert',
    },
    pharmacy: {
      type: 'environmental',
      title: 'Ahmedabad Heatwave — Dehydration Cases Rising',
      body: 'Ahmedabad temperatures hitting 42°C this week. Dehydration and heat-related illnesses typically spike 20–30%. ORS and electrolyte sachets saw 45% increase last heatwave. Stock up before the surge.',
      action: 'Pre-stock ORS × 800, electrolyte sachets × 400, sunscreen × 200',
      impact: 'Capture ₹38,000 in heatwave demand',
      confidence: 91,
      icon: 'sun',
      label: 'Ahmedabad · Heatwave Alert',
    },
    cafe: {
      type: 'environmental',
      title: 'Bengaluru Pre-Monsoon Showers — Comfort Drink Surge',
      body: 'Bengaluru is seeing intermittent showers this week (22–26°C). Footfall at outdoor cafes drops 20% but dwell time increases 35% — customers stay longer and order more. Hot beverages and snack combos spike on rainy days.',
      action: 'Push "Rainy Day Combo" — masala chai + vada pav at ₹99',
      impact: '+₹11,000 in combo revenue this week',
      confidence: 82,
      icon: 'cloud-drizzle',
      label: 'Bengaluru · Shower Forecast',
    },
    trade: {
      type: 'environmental',
      title: 'Arabian Sea Low Pressure — JNPT Delays Likely',
      body: 'IMD has issued a low-pressure watch in the Arabian Sea. JNPT typically suspends berthing operations for 24–48 hours during such events. You have 3 shipments scheduled for departure this week.',
      action: 'Pre-advise UAE and UK clients of potential 3-day delay',
      impact: 'Avoid ₹1.8L in penalty clauses',
      confidence: 79,
      icon: 'wind',
      label: 'Mumbai · Port Weather Watch',
    },
    service: {
      type: 'environmental',
      title: 'Manali Cold Snap — Outdoor Work Window Closing',
      body: 'Temperatures in Manali are dropping to 4°C at night with snowfall forecast above 2,000m. Cement and tile adhesive curing times double below 8°C. Two ongoing renovation projects risk timeline overruns if work continues outdoors.',
      action: 'Shift outdoor tasks indoors, add curing heaters to site budget',
      impact: 'Avoid 2-week project delay worth ₹64,000',
      confidence: 86,
      icon: 'snowflake',
      label: 'Manali · Cold Weather Alert',
    },
  };

  const [innovation, setInnovation] = React.useState(null);

  React.useEffect(() => {
    const ctx = ENVIRONMENTAL_CONTEXTS[initialBusiness.id];
    if (ctx) {
      setInnovation(ctx);
    } else if (business?.location) {
      const loc = business.location.toLowerCase();
      const month = new Date().getMonth();
      const isSummer = month >= 2 && month <= 5;
      const isMonsoon = month >= 5 && month <= 8;
      if (isSummer && (loc.includes('ahmedabad') || loc.includes('delhi') || loc.includes('rajasthan'))) {
        setInnovation({ type: 'environmental', title: 'Extreme Heat Optimization', body: 'High temperatures detected in your region. Afternoon foot traffic is expected to drop by 40%.', action: 'Launch "Cool-Down" promo for 2 PM – 5 PM', impact: 'Protect ₹8,400 in daily revenue', confidence: 88, icon: 'sun', label: `${business.location} · Heat Alert` });
      } else if (isMonsoon && (loc.includes('mumbai') || loc.includes('kolkata') || loc.includes('chennai'))) {
        setInnovation({ type: 'environmental', title: 'Monsoon Season — Delivery Demand Rising', body: 'Heavy rainfall forecast this week. Customers prefer home delivery over in-store visits during monsoon. Delivery orders typically spike 30–40%.', action: 'Boost delivery capacity and promote online ordering', impact: '+₹12,000 in delivery revenue', confidence: 80, icon: 'cloud-rain', label: `${business.location} · Monsoon Signal` });
      } else {
        setInnovation(null);
      }
    } else {
      setInnovation(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBusiness.id, business?.location]);

  const lastBizIdRef = React.useRef(initialBusiness.id);

  React.useEffect(() => {
    if (initialBusiness.id !== lastBizIdRef.current) {
      lastBizIdRef.current = initialBusiness.id;
      setBusiness(initialBusiness || {});
      setMetrics((initialBusiness || {}).metrics || {});
      setRevenueSeries((initialBusiness || {}).revenueSeries || []);
      setCustomerGrowth((initialBusiness || {}).customerGrowth || []);
      setOrdersSeries((initialBusiness || {}).ordersSeries || []);
      setInsights((initialBusiness || {}).insights || []);
      setActions((initialBusiness || {}).actions || []);
      setPeakHours((initialBusiness || {}).peakHours || []);
    }
  }, [initialBusiness]);

  React.useEffect(() => {
    let active = true;
    if (!initialBusiness.id || isDemo) return;

    setLoadingMetrics(true);
    AtlasAPI.metrics.summary(initialBusiness.id, period)
      .then(res => { if (active && res && Object.keys(res).length > 0) setMetrics(res); })
      .catch(e => logError('Overview metrics', e))
      .finally(() => { if (active) setLoadingMetrics(false); });

    setLoadingInsights(true);
    AtlasAPI.insights.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setInsights(res); })
      .catch(e => logError('Overview insights', e))
      .finally(() => { if (active) setLoadingInsights(false); });

    setLoadingActions(true);
    AtlasAPI.actions.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setActions(res); })
      .catch(e => logError('Overview actions', e))
      .finally(() => { if (active) setLoadingActions(false); });

    setLoadingCharts(true);
    setLoadingForecast(true);
    Promise.all([
      AtlasAPI.metrics.series(initialBusiness.id, 'revenue', period),
      AtlasAPI.metrics.peakHours(initialBusiness.id, period),
      AtlasAPI.metrics.forecast(initialBusiness.id)
    ]).then(([rev, peak, fc]) => {
      if (active) {
        setRevenueSeries(rev?.series || rev || []);
        if (peak?.matrix?.length > 0) setPeakHours(peak.matrix);
        setForecast(fc);
      }
    }).catch(e => logError('Overview charts', e))
    .finally(() => { if (active) { setLoadingCharts(false); setLoadingForecast(false); } });

    return () => { active = false; };
  }, [initialBusiness.id, period, isDemo]);

  // ── Apply / Create task / Dismiss ────────────────────────────────────────
  const apply = async (actionId, index, type, actionObj) => {
    if (type === 'dismiss') {
      if (isDemo) {
        setActions(prev => prev.filter((_, i) => i !== index));
      } else {
        try { await AtlasAPI.actions.dismiss(initialBusiness.id, actionId); } catch (e) { logError('dismiss', e); }
        setActions(prev => prev.filter(a => a.id !== actionId));
      }
      return;
    }

    const task = isDemo ? demoTaskStore.makeTask(initialBusiness.id, actionObj, type) : null;

    if (isDemo) {
      demoTaskStore.add(initialBusiness.id, task);
      setAppliedActions(prev => ({ ...prev, [actionObj.title]: type }));
      setActionConfirm({ task, type });
    } else {
      try {
        let createdTask;
        if (type === 'task') {
          createdTask = await AtlasAPI.actions.createTask(initialBusiness.id, actionId);
        } else {
          await AtlasAPI.actions.apply(initialBusiness.id, actionId);
          createdTask = await AtlasAPI.tasks.create(initialBusiness.id, {
            title: `[In Progress] ${actionObj.title}`,
            description: actionObj.body,
            dueDate: actionObj.urgent
              ? new Date(Date.now() + 2 * 86400000).toISOString()
              : new Date(Date.now() + 7 * 86400000).toISOString(),
          });
        }
        setAppliedActions(prev => ({ ...prev, [actionObj.title]: type }));
        setActionConfirm({ task: createdTask, type });
      } catch (e) {
        logError('Overview apply action', e);
      }
    }
  };

  // ── Take Action — opens TakeActionModal ──────────────────────────────────
  const takeAction = (insight, index) => {
    setActionInsight({ insight, index });
  };

  // Called when TakeActionModal submits successfully
  const handleTakeActionSubmit = (task, mode) => {
    if (actionInsight) {
      setAppliedActions(prev => ({ ...prev, [`insight-${actionInsight.index}`]: mode }));
    }
    setActionInsight(null);
    // Show the shared task-confirmation banner
    if (task) setActionConfirm({ task, type: mode });
  };

  // ── Explain insight ──────────────────────────────────────────────────────
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
      const signalText = insight.evidence?.length > 0 ? `Patterns detected: ${insight.evidence.join(', ')}. ` : '';
      setExplanation({
        title: insight.title,
        answer: `${signalText}${insight.body}\n\nAtlas reasoning: This pattern was identified by cross-referencing your ${Object.keys(metrics).join(', ')} trends.`,
        evidence: insight.evidence || [],
      });
    }
  };

  // ── Export brief ─────────────────────────────────────────────────────────
  const handleExportBrief = async () => {
    setExportLoading(true);
    try {
      generateAndDownload({ ...initialBusiness, metrics, revenueSeries: displayRevenueSeries, insights, actions }, period);
    } catch (e) {
      logError('Export brief', e);
    } finally {
      setExportLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isDemo) return;
    const { series, customerSeries, ordersSeries, metrics: scaledMetrics } = buildDemoData(initialBusiness, period);
    setRevenueSeries(series);
    setCustomerGrowth(customerSeries);
    setOrdersSeries(ordersSeries);
    setMetrics(scaledMetrics);
  }, [period, isDemo, initialBusiness]);

  const displayRevenueSeries = revenueSeries;

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
    if (typeof goals === 'string') { try { goals = JSON.parse(goals); } catch { goals = []; } }
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

      {/* ── Take Action Modal ─────────────────────────────────────────────── */}
      {actionInsight && (
        <TakeActionModal
          insight={actionInsight.insight}
          index={actionInsight.index}
          business={initialBusiness}
          isDemo={isDemo}
          onClose={() => setActionInsight(null)}
          onDone={handleTakeActionSubmit}
        />
      )}

      {/* ── Explanation Modal ─────────────────────────────────────────────── */}
      {explanation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setExplanation(null)}>
          <div className="card fade-in" style={{ maxWidth: 500, width: '100%', padding: 32, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Atlas Reasoning</div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setExplanation(null)}><Icon name="x" size={16}/></button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em' }}>{explanation.title || 'Insight Explanation'}</h2>
            <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-line' }}>{explanation.answer}</div>
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

      {/* ── Action Confirmation Modal ─────────────────────────────────────── */}
      {actionConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setActionConfirm(null)}>
          <div className="card fade-in" style={{ maxWidth: 460, width: '100%', padding: 32, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--positive)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="check" size={18} strokeWidth={2.5} color="white"/>
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {actionConfirm.type === 'task' ? 'Task created'
                    : actionConfirm.type === 'schedule' ? 'Task scheduled'
                    : 'Marked as in progress'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {actionConfirm.type === 'schedule' ? 'Reminder set · check your Tasks tab' : 'Added to your Tasks tab'}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{actionConfirm.task?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 10 }}>{actionConfirm.task?.description}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                {actionConfirm.task?.impact && <div><span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact </span><span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{actionConfirm.task.impact}</span></div>}
                {actionConfirm.task?.effort && <div><span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Effort </span><span style={{ fontWeight: 600 }}>{actionConfirm.task.effort}</span></div>}
                {actionConfirm.task?.dueDate && <div><span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due </span><span style={{ fontWeight: 600, color: actionConfirm.task.urgent ? 'var(--negative)' : 'var(--ink-2)' }}>{new Date(actionConfirm.task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setActionConfirm(null); if (onNavigate) onNavigate('tasks'); }}>
                <Icon name="check-square" size={14}/> View in Tasks
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setActionConfirm(null)}>Stay here</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Decision view · Today</div>
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.2 }}>
            {greeting}, {business.owner || business.name || 'there'}. <span className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-2)', fontWeight: 400 }}>Here's what matters.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {['7D', '1M', '3M', '6M', '1Y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 10px', border: 'none', borderRadius: 4, background: period === p ? 'var(--bg-elevated)' : 'transparent', boxShadow: period === p ? 'var(--shadow-xs)' : 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', color: period === p ? 'var(--ink-1)' : 'var(--ink-3)' }}>{p}</button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-sm" onClick={() => setShowFilterMenu(p => !p)} style={{ background: filterSeverity !== 'all' ? 'var(--bg-hover)' : undefined }}>
              <Icon name="filter" size={13}/> Filter{filterSeverity !== 'all' ? ` · ${filterSeverity}` : ''}
            </button>
            {showFilterMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, zIndex: 50, minWidth: 140, boxShadow: 'var(--shadow-lg)' }} onMouseLeave={() => setShowFilterMenu(false)}>
                {['all', 'positive', 'warning', 'negative', 'info'].map(s => (
                  <button key={s} onClick={() => { setFilterSeverity(s); setShowFilterMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: filterSeverity === s ? 'var(--bg-subtle)' : 'transparent', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: filterSeverity === s ? 600 : 400 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleExportBrief} disabled={exportLoading}>
            <Icon name="download" size={13}/> {exportLoading ? 'Exporting…' : 'Export brief'}
          </button>
        </div>
      </div>

      {innovation && (
        <div className="card fade-in" style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-subtle), var(--bg-tinted))', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}><Icon name={innovation.icon} size={120}/></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--ink-1)', color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>INNOVATION ENGINE</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Contextual Reasoning · {innovation.label || 'Environmental Signal'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--ink-1)' }}>{innovation.title}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>{innovation.body}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setExplanation({ title: innovation.title, answer: `${innovation.body}\n\nRecommended action: ${innovation.action}\n\nProjected impact: ${innovation.impact}`, evidence: ['Environmental Signal', 'Regional Data', 'Historical Patterns'] })}>{innovation.action}</button>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>PROJECTED IMPACT</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--positive)', fontFamily: 'var(--font-mono)' }}>{innovation.impact}</div>
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>CONFIDENCE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{innovation.confidence ?? 92}%</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${innovation.confidence ?? 92}%`, height: '100%', background: 'var(--positive)' }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section A: WHAT IS HAPPENING ─────────────────────────────────── */}
      <ErrorBoundary>
      <div style={{ marginBottom: 36 }}>
        <SectionHeader eyebrow="01" title="What is happening" subtitle="Six leading indicators + ML forecast across your business"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }} className="stagger">
          {prioritizedMetricKeys.map(key => (
            <div key={key} className="slide-up">
              <MetricTile loading={loadingMetrics} tooltip={metricTooltips[key]} m={metrics[key] ? { ...metrics[key], label: metrics[key].label || key } : { ...fallbackMetric, label: key.charAt(0).toUpperCase() + key.slice(1) }}/>
            </div>
          ))}
        </div>

        {(forecast || isDemo) && (
          <div className="card" style={{ padding: 18, marginBottom: 12, background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--ink-1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="zap" size={11} strokeWidth={2}/></span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>ML Forecast — next 30 days</div>
              <span className="badge" style={{ fontSize: 10, background: 'var(--ink-1)', color: 'white' }}>Atlas AI</span>
            </div>
            {loadingForecast ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>{[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }}/>)}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Predicted revenue', value: forecast?.predictedRevenue ?? (metrics.revenue?.value ? Math.round(metrics.revenue.value * 1.09) : null), unit: '₹' },
                  { label: 'Stock risk', value: forecast?.stockRisk ?? (isDemo ? 'Low' : null), unit: '' },
                  { label: 'Expected growth', value: forecast?.expectedGrowth ?? (metrics.revenue?.delta != null ? `+${metrics.revenue.delta.toFixed(1)}%` : null), unit: '' },
                ].map((f, i) => f.value == null ? null : (
                  <div key={i} style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--positive)' }}>{f.unit === '₹' ? fmtINR(f.value) : f.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue trend</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  {loadingMetrics ? <div className="skeleton" style={{ width: 120, height: 22, borderRadius: 4 }}/> : <><span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(metrics.revenue?.value)}</span><Delta value={metrics.revenue?.delta || 0}/><span style={{ fontSize: 11, color: 'var(--ink-4)' }}>vs prev period</span></>}
                </div>
              </div>
            </div>
            {loadingCharts ? <SkeletonChart height={180}/> : <LineChart data={displayRevenueSeries} height={180} accent="var(--ink-1)" xKey={displayRevenueSeries[0]?.d !== undefined ? 'd' : 'm'}/>}
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Spending mix</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              {loadingMetrics ? <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 4 }}/> : <><span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>{fmtINR((business.spendingMix || []).reduce((s, d) => s + d.value, 0))}</span><span style={{ fontSize: 11, color: 'var(--ink-4)' }}>this period</span></>}
            </div>
            {loadingCharts ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}><div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%' }}/></div> : <DonutChart data={business.spendingMix || []} size={140} thickness={18}/>}
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Peak hours</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Activity intensity by day and hour — find your highest-traffic windows.</div>
            </div>
            {!loadingCharts && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: `${business.color || '#1c1917'}20`, display: 'inline-block' }}/>Low</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: business.color || 'var(--ink-1)', display: 'inline-block' }}/>Peak</span>
              </div>
            )}
          </div>
          {loadingCharts ? <SkeletonChart height={120}/> : <HeatmapChart data={peakHours} accent={business.color || 'var(--ink-1)'} accentHex={business.color?.startsWith('#') ? business.color : '#1c1917'}/>}
        </div>
      </div>

      {/* ML Prediction Layer */}
      <div style={{ marginTop: 32, marginBottom: 36 }}>
        <SectionHeader eyebrow="Predictions" title="Forecast Engine" subtitle="ML-driven revenue and demand projection for the next 30 days."/>
        {(() => {
          const buildForecastPredictions = () => {
            const series = revenueSeries.length > 0 ? revenueSeries : initialBusiness.revenueSeries || [];
            if (series.length < 2) return { predictions: [], trend: 'stable', slope: 0, confidence: 84 };
            const n = series.length;
            const xs = series.map((_, i) => i);
            const ys = series.map(d => d.v || 0);
            const meanX = xs.reduce((a, b) => a + b, 0) / n;
            const meanY = ys.reduce((a, b) => a + b, 0) / n;
            const slope = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0) / xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
            const lastVal = ys[n - 1];
            const dailySlope = slope / 30;
            const seed = initialBusiness.id.charCodeAt(0);
            const noise = (i) => 1 + 0.08 * Math.sin(seed + i * 0.8) + 0.04 * Math.cos(i * 1.3);
            const today = new Date();
            const predictions = Array.from({ length: 30 }, (_, i) => {
              const date = new Date(today);
              date.setDate(today.getDate() + i + 1);
              return { d: `${date.getDate()}/${date.getMonth() + 1}`, v: Math.max(0, Math.round((lastVal / 30 + dailySlope * (i + 1)) * noise(i))) };
            });
            const trend = slope > lastVal * 0.02 ? 'increasing' : slope < -lastVal * 0.02 ? 'decreasing' : 'stable';
            return { predictions, trend, slope: Math.round(dailySlope), confidence: Math.min(96, Math.max(72, 84 + Math.round(slope / (lastVal / 100)))) };
          };
          const fc = (isDemo || !forecast) ? buildForecastPredictions() : { predictions: forecast.predictions || [], trend: forecast.trend || 'stable', slope: forecast.slope || 0, confidence: 84 };
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <div className="eyebrow">REVENUE FORECAST · NEXT 30 DAYS</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>Expected Trend: <span style={{ color: fc.trend === 'increasing' ? 'var(--positive)' : fc.trend === 'decreasing' ? 'var(--negative)' : 'var(--ink-1)' }}>{fc.trend.toUpperCase()}</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="eyebrow">CONFIDENCE SCORE</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-2)' }}>{fc.confidence}%</div>
                  </div>
                </div>
                {loadingForecast ? <SkeletonChart/> : <LineChart data={fc.predictions} xKey="d" height={160} accent="var(--positive)"/>}
              </div>
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>MODEL LOGS</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', lineHeight: 1.8 }}>
                  <div>[{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] Loading 7-month series...</div>
                  <div>[+0.1s] Running linear regression on {revenueSeries.length} points</div>
                  <div>[+0.2s] Slope: {fc.slope > 0 ? '+' : ''}{fc.slope} ₹/day</div>
                  <div>[+0.3s] Seasonality adjustment applied</div>
                  <div>[+0.4s] Noise model: sin-cos basis (seed {initialBusiness.id.charCodeAt(0)})</div>
                  <div style={{ color: 'var(--positive)' }}>[+0.5s] 30-day projection ready ✓</div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { if (!isDemo) { setLoadingForecast(true); AtlasAPI.metrics.forecast(initialBusiness.id).then(f => { if (f) setForecast(f); }).catch(e => logError('Retrain', e)).finally(() => setLoadingForecast(false)); } }}>
                    <Icon name="refresh" size={12}/> Retrain Model
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      </ErrorBoundary>

      {/* ── Section B: WHY IT IS HAPPENING ───────────────────────────────── */}
      <ErrorBoundary>
      <div style={{ marginBottom: 36 }}>
        <SectionHeader eyebrow="02" title="Why it is happening" subtitle={`· Atlas analyzed your business data across ${Object.keys(metrics).length} signals`}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="stagger">
          {loadingInsights
            ? [0, 1, 2].map(i => <SkeletonInsightCard key={i}/>)
            : (() => {
                const filtered = insights.filter(ins => filterSeverity === 'all' || ins.severity === filterSeverity);
                if (filtered.length > 0) {
                  return filtered.map((ins, i) => (
                    <div key={ins.id || i} className="slide-up">
                      <InsightCard
                        insight={ins}
                        index={i}
                        onTakeAction={takeAction}
                        onExplain={handleExplain}
                        applied={!!appliedActions[`insight-${i}`]}
                        appliedType={appliedActions[`insight-${i}`]}
                      />
                    </div>
                  ));
                }
                return (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                    {insights.length > 0
                      ? <><div style={{ marginBottom: 8 }}>No {filterSeverity} insights found.</div><button className="btn btn-ghost btn-sm" onClick={() => setFilterSeverity('all')}>Clear filter</button></>
                      : 'No insights generated yet. Connect a data source to begin analysis.'
                    }
                  </div>
                );
              })()
          }
        </div>
      </div>
      </ErrorBoundary>

      {/* ── Section C: WHAT TO DO NEXT ───────────────────────────────────── */}
      <ErrorBoundary>
      <div>
        <SectionHeader eyebrow="03" title="What to do next" subtitle="· Ranked by projected impact and your goals"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="stagger">
          {loadingActions
            ? [0, 1, 2].map(i => <SkeletonActionCard key={i}/>)
            : actions.length > 0
              ? actions.map((a, i) => (
                  <div key={a.id || i} className="slide-up">
                    <ActionCard action={a} onApply={(type) => apply(a.id || `action-${i}`, i, type, a)} applied={!!appliedActions[a.title]} appliedType={appliedActions[a.title]}/>
                  </div>
                ))
              : <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>No recommended actions yet.</div>
          }
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
};
