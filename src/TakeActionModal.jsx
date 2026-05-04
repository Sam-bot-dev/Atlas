import React from 'react';
import { Icon, severityStyle, fmtINR } from './ui';
import { AtlasAPI } from './api';
import { demoTaskStore } from './demoTasks';

// ─── generateActionSteps ─────────────────────────────────────────────────────
// Derives 3 contextual action steps from insight content via keyword matching.
export function generateActionSteps(insight) {
  const text = ((insight?.title || '') + ' ' + (insight?.body || '')).toLowerCase();

  if (text.includes('revenue') || text.includes('sales') || text.includes('earning')) {
    return [
      'Review pricing on underperforming SKUs and identify margin leaks',
      'Run a targeted promotion for your top 20% customers this week',
      'Identify your top 3 revenue drivers and double down on them',
    ];
  }
  if (text.includes('stock') || text.includes('inventor') || text.includes('reorder') || text.includes('supply')) {
    return [
      'Audit current stock levels against your reorder thresholds today',
      'Place an emergency purchase order for your critical SKUs',
      'Set automated low-stock alerts for next 30 days',
    ];
  }
  if (text.includes('customer') || text.includes('retention') || text.includes('churn') || text.includes('loyalty') || text.includes('repeat')) {
    return [
      'Segment at-risk customers and send a personalised re-engagement offer',
      'Review top churned customers from last 90 days and identify the pattern',
      'Launch a loyalty incentive for your highest-value accounts',
    ];
  }
  if (text.includes('margin') || text.includes('cost') || text.includes('expense') || text.includes('profit')) {
    return [
      'Identify top 3 cost centres and review efficiency opportunities',
      'Renegotiate supplier terms for your highest-volume inputs',
      'Model the margin impact of a 5% price adjustment on key products',
    ];
  }
  if (text.includes('delivery') || text.includes('shipment') || text.includes('delay') || text.includes('logistics')) {
    return [
      'Alert affected customers immediately with revised timelines',
      'Review supply chain bottlenecks with your logistics partner',
      'Pre-position safety stock to cushion the next peak period',
    ];
  }
  if (text.includes('review') || text.includes('rating') || text.includes('sentiment') || text.includes('feedback')) {
    return [
      'Respond to all 3★ and below reviews within 24 hours',
      'Request reviews from your most satisfied recent customers',
      'Address the top complaint categories in your daily operations',
    ];
  }
  if (text.includes('forecast') || text.includes('growth') || text.includes('trend') || text.includes('predict')) {
    return [
      'Validate forecast assumptions against last 3 months of actuals',
      'Brief the team on the expected demand change and its implications',
      'Prepare contingency plans for a ±15% deviation from the forecast',
    ];
  }
  if (text.includes('humidity') || text.includes('heat') || text.includes('weather') || text.includes('rain') || text.includes('monsoon') || text.includes('cold') || text.includes('snow')) {
    return [
      'Adjust store hours or operations to match the weather forecast',
      'Pre-stock products that historically spike during this weather pattern',
      'Alert customers and staff about any operational changes this week',
    ];
  }
  if (text.includes('foot traffic') || text.includes('footfall') || text.includes('walk-in') || text.includes('visitor')) {
    return [
      'Review the hours where foot traffic drops and plan promotional activity',
      'Test an off-peak offer to drive visits during slow windows',
      'Measure conversion rate during high-traffic vs low-traffic hours',
    ];
  }
  // Default fallback
  return [
    'Assign clear ownership of this action to a responsible team member',
    'Set a follow-up review checkpoint within the next 7 days',
    'Document the outcome and share progress with key stakeholders',
  ];
}

// ─── MODE CONFIG ─────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'task',
    label: 'Create Task',
    icon: 'check-square',
    desc: 'Add to Tasks tab as a pending action item',
    submitLabel: 'Create Task',
  },
  {
    id: 'apply',
    label: 'Apply Now',
    icon: 'zap',
    desc: 'Mark as in-progress and track in Tasks',
    submitLabel: 'Apply & Track',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: 'calendar',
    desc: 'Set a reminder for a future date',
    submitLabel: 'Schedule Task',
  },
];

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fee2e2' },
  { id: 'normal', label: 'Normal', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  { id: 'low',    label: 'Low',    color: 'var(--ink-3)', bg: 'var(--bg-subtle)' },
];

// ─── TakeActionModal ─────────────────────────────────────────────────────────
export const TakeActionModal = ({ insight, index, business, isDemo, onClose, onDone }) => {
  const s = severityStyle(insight?.severity || 'info');
  const steps = generateActionSteps(insight);

  const [checkedSteps, setCheckedSteps] = React.useState([0, 1, 2]);
  const [mode, setMode]                 = React.useState('task');
  const [priority, setPriority]         = React.useState(insight?.severity === 'negative' ? 'urgent' : 'normal');
  const [notes, setNotes]               = React.useState('');
  const [dueDate, setDueDate]           = React.useState('');
  const [reminderDate, setReminderDate] = React.useState('');
  const [reminderTime, setReminderTime] = React.useState('09:00');
  const [submitting, setSubmitting]     = React.useState(false);
  const [done, setDone]                 = React.useState(false);
  const [createdTask, setCreatedTask]   = React.useState(null);
  const [errors, setErrors]             = React.useState({});

  const backdropRef = React.useRef();
  const today = new Date().toISOString().split('T')[0];

  // Close on Escape
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !done) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, done]);

  const toggleStep = (i) =>
    setCheckedSteps(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const validate = () => {
    const e = {};
    if (mode === 'schedule' && !reminderDate) e.reminderDate = 'Pick a reminder date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    // Build description from insight body + selected steps + notes
    const selectedSteps = steps.filter((_, i) => checkedSteps.includes(i));
    const stepText = selectedSteps.length > 0
      ? '\n\nAction steps:\n' + selectedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '';
    const notesText = notes.trim() ? `\n\nNotes: ${notes.trim()}` : '';
    const description = (insight?.body || '') + stepText + notesText;

    const urgencyMs = priority === 'urgent' ? 2 : priority === 'normal' ? 7 : 14;
    const due = dueDate || new Date(Date.now() + urgencyMs * 86400000).toISOString();

    const payload = {
      title: insight?.title || 'Untitled Action',
      description,
      urgent: priority === 'urgent',
      dueDate: due,
      impact: insight?.impact,
      effort: insight?.effort,
      reminder: mode === 'schedule' && reminderDate ? {
        at: `${reminderDate}T${reminderTime}:00`,
        methods: ['notification'],
      } : undefined,
    };

    let task;
    try {
      if (isDemo) {
        task = demoTaskStore.makeTask(business.id, {
          ...payload,
          body: description,
          urgent: priority === 'urgent',
        }, mode === 'apply' ? 'apply' : 'task');
        // Merge in the reminder if scheduled
        task = { ...task, reminder: payload.reminder };
        demoTaskStore.add(business.id, task);
      } else {
        task = await AtlasAPI.tasks.create(business.id, {
          ...payload,
          status: mode === 'apply' ? 'in_progress' : 'pending',
        });
      }
      // Schedule browser notification if requested
      if (payload.reminder?.methods?.includes('notification') && payload.reminder?.at) {
        scheduleNotification(payload.title, payload.reminder.at);
      }
      setCreatedTask(task);
      setDone(true);
      onDone(task, mode);
    } catch (err) {
      console.error('TakeActionModal submit failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const modeConfig = MODES.find(m => m.id === mode) || MODES[0];
  const priorityConfig = PRIORITIES.find(p => p.id === priority) || PRIORITIES[1];
  const severityLabel = insight?.severity === 'positive' ? 'OPPORTUNITY'
    : insight?.severity === 'warning' ? 'WATCH'
    : insight?.severity === 'negative' ? 'RISK'
    : 'PATTERN';

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current && !done) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: '100%', maxWidth: 560,
          padding: 0, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px var(--border)',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Success State ─────────────────────────────────────────────── */}
        {done && createdTask ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--positive-soft)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={26} strokeWidth={2.5} color="var(--positive)"/>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              {mode === 'apply' ? 'Marked as In Progress' : mode === 'schedule' ? 'Task Scheduled' : 'Task Created'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 28 }}>
              {mode === 'schedule'
                ? `Reminder set for ${new Date(`${reminderDate}T${reminderTime}`).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'You can track this in the Tasks tab'}
            </div>

            {/* Task preview */}
            <div style={{
              background: 'var(--bg-subtle)', borderRadius: 10,
              padding: 16, marginBottom: 24,
              border: '1px solid var(--border)', textAlign: 'left',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--ink-1)' }}>
                {createdTask.title}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 4,
                  background: priorityConfig.bg, color: priorityConfig.color,
                  fontWeight: 600, fontSize: 10,
                }}>
                  {priorityConfig.label}
                </span>
                {createdTask.dueDate && (
                  <span>Due {new Date(createdTask.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                )}
                {mode === 'apply' && (
                  <span style={{ color: 'var(--warning)', fontWeight: 500 }}>● In Progress</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onClose}
              >
                <Icon name="check-square" size={14}/> View in Tasks
              </button>
              <button className="btn btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{
              padding: '20px 24px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-tinted)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: s.bg, color: s.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={s.icon} size={11} strokeWidth={2}/>
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: s.color, textTransform: 'uppercase' }}>
                      {severityLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', lineHeight: 1.3 }}>
                    {insight?.title}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '5px 7px', flexShrink: 0 }}
                  onClick={onClose}
                >
                  <Icon name="x" size={14} color="var(--ink-3)"/>
                </button>
              </div>
              {insight?.body && (
                <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55, marginTop: 10 }}>
                  {insight.body}
                </div>
              )}
              {/* Evidence chips */}
              {insight?.evidence?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {insight.evidence.map((e, i) => (
                    <span key={i} className="badge" style={{ fontSize: 10 }}>{e}</span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Scrollable body ─────────────────────────────────────────── */}
            <div style={{ overflowY: 'auto', flex: 1 }}>

              {/* Suggested Steps */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Suggested Steps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {steps.map((step, i) => {
                    const checked = checkedSteps.includes(i);
                    return (
                      <label
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${checked ? 'var(--border-strong)' : 'var(--border)'}`,
                          background: checked ? 'var(--bg-subtle)' : 'transparent',
                          transition: 'all 120ms', userSelect: 'none',
                        }}
                      >
                        <div
                          onClick={() => toggleStep(i)}
                          style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                            border: `2px solid ${checked ? 'var(--ink-1)' : 'var(--border-strong)'}`,
                            background: checked ? 'var(--ink-1)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 120ms',
                          }}
                        >
                          {checked && <Icon name="check" size={9} strokeWidth={3} color="white"/>}
                        </div>
                        <span
                          onClick={() => toggleStep(i)}
                          style={{ fontSize: 13, color: checked ? 'var(--ink-1)' : 'var(--ink-3)', lineHeight: 1.45 }}
                        >
                          {step}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Mode selector */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  How do you want to handle this?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {MODES.map(m => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '12px 8px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${active ? 'var(--ink-1)' : 'var(--border)'}`,
                          background: active ? 'var(--ink-1)' : 'transparent',
                          transition: 'all 140ms',
                        }}
                      >
                        <Icon name={m.icon} size={15} color={active ? 'white' : 'var(--ink-3)'}/>
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'white' : 'var(--ink-2)' }}>
                          {m.label}
                        </span>
                        <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : 'var(--ink-4)', textAlign: 'center', lineHeight: 1.3 }}>
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task config */}
              <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Priority */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Priority
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PRIORITIES.map(p => {
                      const active = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          style={{
                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${active ? p.color : 'var(--border)'}`,
                            background: active ? p.bg : 'transparent',
                            color: active ? p.color : 'var(--ink-3)',
                            transition: 'all 120ms',
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    Due date <span style={{ color: 'var(--ink-5)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    min={today}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>

                {/* Schedule reminder (only when mode = schedule) */}
                {mode === 'schedule' && (
                  <div style={{
                    padding: 14, borderRadius: 10,
                    border: '1.5px solid var(--border-strong)',
                    background: 'var(--bg-subtle)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="bell" size={12} color="var(--ink-2)"/>
                      Reminder
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
                          Date <span style={{ color: 'var(--negative)' }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="input"
                          min={today}
                          value={reminderDate}
                          onChange={e => { setReminderDate(e.target.value); setErrors(p => ({ ...p, reminderDate: undefined })); }}
                          style={{ fontSize: 13 }}
                        />
                        {errors.reminderDate && (
                          <div style={{ fontSize: 11, color: 'var(--negative)', marginTop: 4 }}>{errors.reminderDate}</div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Time</label>
                        <input
                          type="time"
                          className="input"
                          value={reminderTime}
                          onChange={e => setReminderTime(e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="info" size={10} color="var(--ink-4)"/>
                      Browser notification will fire at the chosen time if the tab is open
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    Notes <span style={{ color: 'var(--ink-5)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    className="input"
                    placeholder="Add context, instructions, or relevant info for this action…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit' }}
                  />
                </div>

              </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-tinted)',
              display: 'flex', gap: 10, justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
              {/* Step count indicator */}
              <span style={{ fontSize: 12, color: 'var(--ink-4)', marginRight: 'auto' }}>
                {checkedSteps.length} of {steps.length} steps selected
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={submitting}
                onClick={handleSubmit}
                style={{ minWidth: 120, justifyContent: 'center' }}
              >
                {submitting
                  ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 600ms linear infinite' }}/> Creating…</>
                  : <><Icon name={modeConfig.icon} size={12}/> {modeConfig.submitLabel}</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Browser notification scheduler ─────────────────────────────────────────
function scheduleNotification(title, isoAt) {
  if (!('Notification' in window)) return;
  const delay = new Date(isoAt).getTime() - Date.now();
  if (delay <= 0) return;
  const fire = () => new Notification('Atlas Reminder', { body: title, icon: '/favicon.ico' });
  if (Notification.permission === 'granted') {
    setTimeout(fire, delay);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') setTimeout(fire, delay); });
  }
}
