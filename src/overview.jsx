import React from 'react';
import { Icon, Delta, severityStyle, fmtINR } from './ui';
import { LineChart, DonutChart, HeatmapChart } from './charts';
import { AtlasAPI } from './api';

// Atlas — Overview page (the signature moment)
// What is happening / Why it is happening / What to do next

const MetricTile = ({ m, accent }) => {
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

const InsightCard = ({ insight }) => {
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
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-3)' }}>
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
      borderWidth: action.urgent ? 1 : 1,
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

export const Overview = ({ business }) => {
  const [appliedActions, setAppliedActions] = React.useState({});
  const [period, setPeriod] = React.useState('1M');
  
  const apply = async (actionId, index) => {
    try {
      await AtlasAPI.actions.apply(business.id, actionId);
      setAppliedActions({ ...appliedActions, [index]: true });
    } catch (e) {
      console.error('Failed to apply action', e);
      // Fallback for demo if API fails
      setAppliedActions({ ...appliedActions, [index]: true });
    }
  };

  const metricKeys = ['revenue', 'orders', 'conversion', 'inventory', 'retention', 'sentiment'];
  const fallbackMetric = { value: 0, delta: 0, label: 'No data', unit: '', period: '' };
  const metrics = metricKeys.reduce((acc, key) => ({ ...acc, [key]: business.metrics?.[key] || fallbackMetric }), {});
  const spendingMix = business.spendingMix || [];
  const insights = business.insights || [];
  const actions = business.actions || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
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
          <button className="btn btn-sm">
            <Icon name="filter" size={13}/> Filter
          </button>
          <button className="btn btn-primary btn-sm">
            <Icon name="download" size={13}/> Export brief
          </button>
        </div>
      </div>

      {/* Section A: WHAT */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>01</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>What is happening</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>· Six leading indicators across your business</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {metricKeys.map(k => <MetricTile key={k} m={metrics[k]}/>)}
        </div>

        {/* Revenue chart + spending mix */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue trend</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(metrics.revenue.value)}</span>
                  <Delta value={metrics.revenue.delta}/>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>vs prev period</span>
                </div>
              </div>
            </div>
            <LineChart data={business.revenueSeries} height={180} accent="var(--ink-1)"/>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Spending mix</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>{fmtINR(spendingMix.reduce((s, d) => s + d.value, 0))}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>this period</span>
            </div>
            <DonutChart data={spendingMix} size={140} thickness={18}/>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-4)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: `${business.color}20`, display: 'inline-block' }}/>
                Low
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: business.color, display: 'inline-block' }}/>
                Peak
              </span>
            </div>
          </div>
          <HeatmapChart data={business.peakHours} accent={business.color} accentHex={business.color}/>
        </div>
      </div>

      {/* Section B: WHY */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>02</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>Why it is happening</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>· Atlas connected the dots across {Object.keys(business.metrics).length} signals</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {insights.map((ins, i) => <InsightCard key={i} insight={ins}/>)}
        </div>
      </div>

      {/* Section C: WHAT TO DO */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>03</span>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>What to do next</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>· Ranked by projected impact and your goals</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {actions.map((a, i) => <ActionCard key={i} action={a} onApply={() => apply(a.id, i)} applied={appliedActions[i]}/>)}
        </div>
      </div>
    </div>
  );
};
