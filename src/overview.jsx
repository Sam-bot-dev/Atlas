import React from 'react';
import { Icon, Delta, severityStyle, fmtINR, SkeletonMetricTile, SkeletonInsightCard, SkeletonActionCard, SkeletonChart } from './ui';
import { LineChart, DonutChart, HeatmapChart } from './charts';
import { AtlasAPI } from './api';

// Atlas — Overview page (the signature moment)
// What is happening / Why it is happening / What to do next

const MetricTile = ({ m, loading }) => {
  if (loading) return <SkeletonMetricTile />;

  const isCurrency = m.unit === '₹';
  const value = isCurrency ? fmtINR(m.value) : m.unit ? `${m.value}${m.unit}` : m.value.toLocaleString('en-IN');
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 110 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{m.label}</div>
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

const InsightCard = ({ insight, onExplain }) => {
  const s = severityStyle(insight.severity);
  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 5, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={s.icon} size={12} strokeWidth={2}/>
        </span>
        <span className="eyebrow" style={{ color: s.color }}>{insight.severity === 'positive' ? 'OPPORTUNITY' : insight.severity === 'warning' ? 'WATCH' : insight.severity === 'negative' ? 'RISK' : 'PATTERN'}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, color: 'var(--ink-1)' }}>{insight.title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{insight.body}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(insight.evidence || []).map((e, i) => (
            <span key={i} className="badge" style={{ fontSize: 10 }}>{e}</span>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-3)' }} onClick={() => onExplain(insight)}>
          Explain <Icon name="arrow-right" size={11}/>
        </button>
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
            <button className="btn btn-sm" style={{ justifyContent: 'center' }}>Create task</button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Icon name="x" size={13}/></button>
          </>
        )}
      </div>
    </div>
  );
};

export const Overview = ({ business: initialBusiness }) => {
  const [business] = React.useState(initialBusiness);
  const [metrics, setMetrics] = React.useState(initialBusiness.metrics || {});
  const [insights, setInsights] = React.useState(initialBusiness.insights || []);
  const [actions, setActions] = React.useState(initialBusiness.actions || []);
  const [peakHours, setPeakHours] = React.useState(initialBusiness.peakHours || []);

  // Granular loading states per section so each animates independently
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  const [loadingActions, setLoadingActions] = React.useState(false);
  const [loadingCharts, setLoadingCharts] = React.useState(false);

  const [explanation, setExplanation] = React.useState(null);
  const [appliedActions, setAppliedActions] = React.useState({});
  const [period, setPeriod] = React.useState('1M');

  // Fetch real data from API with granular loading per section
  React.useEffect(() => {
    let active = true;
    if (!initialBusiness.id || initialBusiness.id.startsWith('demo-')) return;

    // Metrics
    setLoadingMetrics(true);
    AtlasAPI.metrics.summary(initialBusiness.id, period)
      .then(res => { if (active && res && Object.keys(res).length > 0) setMetrics(res); })
      .catch(console.error)
      .finally(() => { if (active) setLoadingMetrics(false); });

    // Insights
    setLoadingInsights(true);
    AtlasAPI.insights.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setInsights(res); })
      .catch(console.error)
      .finally(() => { if (active) setLoadingInsights(false); });

    // Actions
    setLoadingActions(true);
    AtlasAPI.actions.list(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setActions(res); })
      .catch(console.error)
      .finally(() => { if (active) setLoadingActions(false); });

    // Peak hours / charts
    setLoadingCharts(true);
    AtlasAPI.metrics.peakHours(initialBusiness.id)
      .then(res => { if (active && res && res.length > 0) setPeakHours(res); })
      .catch(console.error)
      .finally(() => { if (active) setLoadingCharts(false); });

    return () => { active = false; };
  }, [initialBusiness.id, period]);

  const apply = async (actionId, index) => {
    try {
      await AtlasAPI.actions.apply(initialBusiness.id, actionId);
      setAppliedActions(prev => ({ ...prev, [index]: true }));
    } catch (e) {
      console.error('Failed to apply action', e);
      setAppliedActions(prev => ({ ...prev, [index]: true }));
    }
  };

  const handleExplain = async (insight) => {
    try {
      const res = await AtlasAPI.insights.explain(initialBusiness.id, insight.id);
      setExplanation(res);
    } catch (e) {
      setExplanation({ title: insight.title, answer: insight.body, evidence: insight.evidence || [] });
    }
  };

  const metricKeys = ['revenue', 'orders', 'conversion', 'inventory', 'retention', 'sentiment'];
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
            {greeting}, {business.owner}. <span className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-2)', fontWeight: 400 }}>Here's what matters.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {['1W', '1M', '3M', '6M'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '4px 10px', border: 'none', borderRadius: 4,
                background: period === p ? 'var(--bg-elevated)' : 'transparent',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
                color: period === p ? 'var(--ink-1)' : 'var(--ink-3)',
              }}>{p}</button>
            ))}
          </div>
          <button className="btn btn-sm"><Icon name="filter" size={13}/> Filter</button>
          <button className="btn btn-primary btn-sm"><Icon name="download" size={13}/> Export brief</button>
        </div>
      </div>

      {/* ── Section A: WHAT IS HAPPENING ─────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>01</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>What is happening</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>· Six leading indicators across your business</div>
        </div>

        {/* Metric tiles — each individual tile shows its own skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {metricKeys.map(k => (
            <MetricTile key={k} m={metrics[k] || fallbackMetric} loading={loadingMetrics} />
          ))}
        </div>

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
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(metrics.revenue?.value || 0)}</span>
                        <Delta value={metrics.revenue?.delta || 0}/>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>vs prev period</span>
                      </>
                  }
                </div>
              </div>
            </div>
            {loadingCharts
              ? <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 8 }}/>
              : <LineChart data={business.revenueSeries} height={180} accent="var(--ink-1)"/>
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
              ? <div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%', margin: '0 auto' }}/>
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
            ? <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 8 }}/>
            : <HeatmapChart data={peakHours} accent={business.color} accentHex={business.color}/>
          }
        </div>
      </div>

      {/* ── Section B: WHY IT IS HAPPENING ────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>02</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>Why it is happening</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            · Atlas connected the dots across {Object.keys(metrics).length} signals
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {loadingInsights
            ? [0, 1, 2].map(i => <SkeletonInsightCard key={i} />)
            : insights.length > 0
              ? insights.map((ins, i) => <InsightCard key={i} insight={ins} onExplain={handleExplain}/>)
              : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                  No insights generated yet. Connect a data source to begin analysis.
                </div>
              )
          }
        </div>
      </div>

      {/* ── Section C: WHAT TO DO NEXT ─────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>03</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>What to do next</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>· Ranked by projected impact and your goals</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {loadingActions
            ? [0, 1, 2].map(i => <SkeletonActionCard key={i} />)
            : actions.length > 0
              ? actions.map((a, i) => <ActionCard key={i} action={a} onApply={() => apply(a.id, i)} applied={appliedActions[i]}/>)
              : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                  No recommended actions yet.
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};
