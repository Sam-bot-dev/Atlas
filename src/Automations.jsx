/**
 * Automations — Real execution engine UI
 *
 * Demo businesses: runs entirely in-browser via automationEngine.js
 *   - Evaluates each trigger against live business metrics
 *   - Creates tasks in demoTaskStore when automations fire
 *   - Shows a live execution log with timestamps and results
 *   - Auto-runs every 30s; manual "Run now" button
 *
 * Real businesses: calls POST /automations/run on the backend
 *   - Backend evaluates active automations and fires side-effects
 *   - Returns execution log shown in the same UI
 */

import React from 'react';
import { Icon, SectionHeader, SkeletonLine } from './ui';
import { AtlasAPI, logError } from './api';
import { runDemoAutomations, runSingleDemoAutomation, automationLogs } from './automationEngine';

const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

// ─── Toggle button (stable identity — defined outside parent) ─────────────────
const AutomationToggle = ({ auto, businessId, isDemo, onToggle }) => {
  const [status, setStatus] = React.useState(auto.status);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    const newStatus = status === 'active' ? 'disabled' : 'active';
    setLoading(true);
    if (!isDemo) {
      try { await AtlasAPI.automations.toggle(businessId, auto.id); } catch { /* silent */ }
    }
    setStatus(newStatus);
    if (onToggle) onToggle(auto.id, newStatus);
    setLoading(false);
  };

  return (
    <button
      className={`btn btn-sm ${status === 'active' ? 'btn-success' : ''}`}
      onClick={handleClick}
      disabled={loading}
      style={{ minWidth: 72 }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }}/>
        </span>
      ) : (
        <>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'active' ? '#16a34a' : 'var(--ink-4)', display: 'inline-block', marginRight: 4 }}/>
          {status === 'active' ? 'Active' : 'Disabled'}
        </>
      )}
    </button>
  );
};

// ─── Execution log entry ──────────────────────────────────────────────────────
const LogEntry = ({ entry }) => {
  const isExecuted = entry.status === 'executed';
  const isSkipped = entry.status === 'skipped';
  const isError = entry.status === 'error';

  const color = isExecuted ? 'var(--positive)' : isError ? 'var(--negative)' : 'var(--ink-4)';
  const icon = isExecuted ? 'check' : isError ? 'alert-circle' : 'minus';

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
      animation: 'fadeIn 300ms ease',
    }}>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <Icon name={icon} size={13} color={color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>{entry.trigger}</span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 500,
            background: isExecuted ? '#dcfce7' : isError ? '#fee2e2' : 'var(--bg-subtle)',
            color: isExecuted ? '#166534' : isError ? '#991b1b' : 'var(--ink-3)',
          }}>
            {isExecuted ? 'FIRED' : isError ? 'ERROR' : 'SKIPPED'}
          </span>
          {entry.taskCreated && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#dbeafe', color: '#1e40af', fontWeight: 500 }}>
              TASK CREATED
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{entry.result}</div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-4)', flexShrink: 0, paddingTop: 2, fontFamily: 'var(--font-mono)' }}>
        {new Date(entry.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const Automations = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [autos, setAutos] = React.useState([]);
  const [suggested, setSuggested] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [runningId, setRunningId] = React.useState(null); // single automation run
  const [logs, setLogs] = React.useState([]);
  const [lastRun, setLastRun] = React.useState(null);
  const [runCount, setRunCount] = React.useState(0);
  const [showLog, setShowLog] = React.useState(true);

  // Load automations
  React.useEffect(() => {
    if (!business?.id) { setLoading(false); return; }

    if (isDemo) {
      setAutos(business.automations || []);
      setSuggested(business.suggestedAutomations || []);
      setLogs(automationLogs.get(business.id));
      setLoading(false);
      return;
    }

    Promise.all([
      AtlasAPI.automations.list(business.id),
      AtlasAPI.automations.suggested(business.id),
    ]).then(([list, sugg]) => {
      setAutos(list || []);
      setSuggested(sugg || []);
      setLogs([]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [business?.id, business?.automations, business?.suggestedAutomations, isDemo]);

  // Auto-run every 30s for demo businesses (simulates a real scheduler)
  React.useEffect(() => {
    if (!isDemo || !business?.id) return;
    const interval = setInterval(() => {
      const activeAutos = autos.filter(a => a.status === 'active');
      if (activeAutos.length === 0) return;
      runDemoAutomations(business, activeAutos);
      setLogs([...automationLogs.get(business.id)]);
      setLastRun(new Date());
      setRunCount(c => c + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [isDemo, business, autos]);

  // ── Run all active automations now ──
  const handleRunAll = async () => {
    if (!business?.id || running) return;
    setRunning(true);
    try {
      if (isDemo) {
        const activeAutos = autos.filter(a => a.status === 'active');
        runDemoAutomations(business, activeAutos);
        setLogs([...automationLogs.get(business.id)]);
        setLastRun(new Date());
        setRunCount(c => c + 1);
        setShowLog(true);
      } else {
        const res = await AtlasAPI.automations.run(business.id);
        setLogs(prev => [...(res.log || []), ...prev].slice(0, 50));
        setLastRun(new Date());
        setRunCount(c => c + 1);
        setShowLog(true);
      }
    } catch (err) {
      logError('Run automations', err);
    } finally {
      setRunning(false);
    }
  };

  // ── Run a single automation ──
  const handleRunSingle = async (auto) => {
    if (runningId) return;
    setRunningId(auto.id);
    try {
      if (isDemo) {
        runSingleDemoAutomation(business, auto);
        setLogs([...automationLogs.get(business.id)]);
        setLastRun(new Date());
        setShowLog(true);
      } else {
        // For real businesses, toggle to active then run all (simplest path)
        await AtlasAPI.automations.run(business.id);
        setLastRun(new Date());
      }
    } catch (err) {
      logError('Run single automation', err);
    } finally {
      setRunningId(null);
    }
  };

  // ── Add suggested automation ──
  const handleAddSuggested = async (sugg, index) => {
    setAdding(index);
    try {
      if (isDemo) {
        const newAuto = { ...sugg, id: `demo-${Date.now()}`, status: 'active', action: sugg.action };
        setAutos(prev => [...prev, newAuto]);
        setSuggested(prev => prev.filter((_, i) => i !== index));
      } else {
        const created = await AtlasAPI.automations.create(business.id, { trigger: sugg.trigger, action: sugg.action });
        setAutos(prev => [...prev, created]);
        setSuggested(prev => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      logError('Add automation', err);
    } finally {
      setAdding(null);
    }
  };

  const handleToggle = (autoId, newStatus) => {
    setAutos(prev => prev.map(a => a.id === autoId ? { ...a, status: newStatus } : a));
  };

  const activeCount = autos.filter(a => a.status === 'active').length;
  const firedCount = logs.filter(l => l.status === 'executed').length;

  if (loading) {
    return (
      <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <SectionHeader eyebrow="Autopilot" title="Automations" subtitle="Rules that run automatically."/>
        <SkeletonLine style={{ width: 200, marginBottom: 16 }}/>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8, marginBottom: 8 }}/>)}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Autopilot"
        title="Automations"
        subtitle={`${activeCount} active · ${runCount > 0 ? `${runCount} run${runCount > 1 ? 's' : ''} this session` : 'Not yet run'}`}
        action={
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRunAll}
            disabled={running || activeCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {running ? (
              <>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }}/>
                Running…
              </>
            ) : (
              <>
                <Icon name="zap" size={13}/>
                Run all now
              </>
            )}
          </button>
        }
      />

      {/* Stats bar */}
      {runCount > 0 && (
        <div className="card fade-in" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', align: 'center', gap: 6 }}>
            <Icon name="check" size={13} color="var(--positive)"/>
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
              <strong style={{ color: 'var(--positive)' }}>{firedCount}</strong> automations fired
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Last run: {lastRun?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Auto-runs every 30s
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowLog(p => !p)}>
              {showLog ? 'Hide log' : 'Show log'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Active automations */}
        {autos.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Active ({autos.length})
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {autos.map((auto, i) => {
                const recentLog = logs.find(l => l.automationId === auto.id);
                const isFired = recentLog?.status === 'executed';
                const isRunningThis = runningId === auto.id;

                return (
                  <div key={auto.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 18px',
                    borderBottom: i === autos.length - 1 ? 'none' : '1px solid var(--border)',
                    background: isFired ? 'rgba(22,163,74,0.04)' : 'transparent',
                    transition: 'background 400ms',
                  }}>
                    {/* Status dot */}
                    <div style={{ paddingTop: 4, flexShrink: 0 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: auto.status === 'active' ? 'var(--positive)' : 'var(--ink-4)',
                        boxShadow: auto.status === 'active' ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none',
                        transition: 'all 300ms',
                      }}/>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{auto.trigger}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: recentLog ? 6 : 0 }}>
                        → {auto.actionType || auto.action}
                      </div>
                      {recentLog && (
                        <div className="fade-in" style={{
                          fontSize: 11, color: isFired ? '#166534' : 'var(--ink-4)',
                          background: isFired ? '#dcfce7' : 'var(--bg-subtle)',
                          padding: '3px 8px', borderRadius: 4, display: 'inline-block',
                          marginTop: 2,
                        }}>
                          {isFired ? '✓ ' : '— '}{recentLog.result}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {/* Run single */}
                      {auto.status === 'active' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          disabled={!!runningId || running}
                          onClick={() => handleRunSingle(auto)}
                          title="Run this automation now"
                        >
                          {isRunningThis ? (
                            <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--ink-3)', borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }}/>
                          ) : (
                            <Icon name="play" size={11}/>
                          )}
                        </button>
                      )}
                      <AutomationToggle
                        auto={auto}
                        businessId={business.id}
                        isDemo={isDemo}
                        onToggle={handleToggle}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested automations */}
        {suggested.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Suggested ({suggested.length})
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {suggested.map((sugg, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: i === suggested.length - 1 ? 'none' : '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{sugg.title || sugg.trigger}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      {sugg.trigger} → {sugg.action}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddSuggested(sugg, i)}
                    disabled={adding === i}
                  >
                    {adding === i ? 'Adding…' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {autos.length === 0 && suggested.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="zap" size={32} color="var(--ink-4)"/>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 16, marginBottom: 8 }}>No automations yet</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 320, margin: '0 auto' }}>
              Automations run on a schedule and fire side-effects like tasks, alerts, and messages.
            </div>
          </div>
        )}

        {/* Execution log */}
        {showLog && logs.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Execution log
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-4)', marginLeft: 8 }}>
                  {logs.length} entries
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
                onClick={() => {
                  if (isDemo) automationLogs.clear(business.id);
                  setLogs([]);
                }}
              >
                Clear
              </button>
            </div>
            <div className="card" style={{ padding: '0 18px' }}>
              {logs.slice(0, 20).map((entry) => (
                <LogEntry key={entry.id} entry={entry}/>
              ))}
              {logs.length > 20 && (
                <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--ink-4)', textAlign: 'center' }}>
                  {logs.length - 20} older entries hidden
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
