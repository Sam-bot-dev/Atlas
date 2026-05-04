import React from 'react';
import { Icon, SectionHeader, SkeletonLine } from './ui';
import { AtlasAPI } from './api';
import { demoTaskStore } from './demoTasks';

const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

const STATUS_COLORS = {
  pending:     { bg: 'var(--bg-subtle)',    color: 'var(--ink-3)',    label: 'Pending' },
  in_progress: { bg: '#fef9c3',             color: '#854d0e',         label: 'In Progress' },
  completed:   { bg: '#dcfce7',             color: '#166534',         label: 'Done' },
};

const REMINDER_METHODS = [
  { value: 'notification', label: 'Browser notification', icon: 'bell' },
  { value: 'email',        label: 'Email',                icon: 'mail' },
  { value: 'in_app',       label: 'In-app alert',         icon: 'message-square' },
];

// ─── Add Task Modal ──────────────────────────────────────────────────────────
const AddTaskModal = ({ onClose, onAdd }) => {
  const [title, setTitle]                   = React.useState('');
  const [description, setDescription]       = React.useState('');
  const [dueDate, setDueDate]               = React.useState('');
  const [urgent, setUrgent]                 = React.useState(false);
  const [reminder, setReminder]             = React.useState(false);
  const [reminderDate, setReminderDate]     = React.useState('');
  const [reminderTime, setReminderTime]     = React.useState('09:00');
  const [reminderMethods, setReminderMethods] = React.useState(['notification']);
  const [adding, setAdding]                 = React.useState(false);
  const [errors, setErrors]                 = React.useState({});

  // Close on backdrop click
  const backdropRef = React.useRef();
  const handleBackdrop = (e) => { if (e.target === backdropRef.current) onClose(); };

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleMethod = (val) => {
    setReminderMethods(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (reminder) {
      if (!reminderDate) e.reminderDate = 'Pick a reminder date';
      if (reminderMethods.length === 0) e.reminderMethods = 'Choose at least one method';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setAdding(true);
    const payload = {
      title:       title.trim(),
      description: description.trim() || undefined,
      dueDate:     dueDate || undefined,
      urgent,
      reminder: reminder ? {
        at:      `${reminderDate}T${reminderTime}:00`,
        methods: reminderMethods,
      } : undefined,
    };
    await onAdd(payload);
    setAdding(false);
  };

  // Minimum date for reminders = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: 540,
          padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh', overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>New Task</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Fill in the details below</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px' }}
            onClick={onClose}
          >
            <Icon name="x" size={15} color="var(--ink-3)"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <Field label="Task title" required error={errors.title}>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Follow up with supplier"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
              style={{ fontSize: 14 }}
            />
          </Field>

          {/* Description */}
          <Field label="Details / description">
            <textarea
              className="input"
              placeholder="What needs to be done, any notes or context…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit' }}
            />
          </Field>

          {/* Due date + Urgent row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <Field label="Due date">
              <input
                type="date"
                className="input"
                min={today}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </Field>
            <ToggleChip
              active={urgent}
              onToggle={() => setUrgent(p => !p)}
              icon="zap"
              label="Urgent"
              activeColor="#dc2626"
            />
          </div>

          {/* Reminder section */}
          <div style={{
            borderRadius: 10,
            border: `1.5px solid ${reminder ? 'var(--ink-1)' : 'var(--border)'}`,
            padding: '14px 16px',
            transition: 'border-color 150ms',
          }}>
            {/* Reminder toggle header */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setReminder(p => !p)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="bell" size={15} color={reminder ? 'var(--ink-1)' : 'var(--ink-3)'}/>
                <span style={{ fontSize: 13, fontWeight: 600, color: reminder ? 'var(--ink-1)' : 'var(--ink-3)' }}>
                  Set a reminder
                </span>
              </div>
              <Switch on={reminder}/>
            </div>

            {/* Expanded reminder fields */}
            {reminder && (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Date + Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Reminder date" required error={errors.reminderDate}>
                    <input
                      type="date"
                      className="input"
                      min={today}
                      value={reminderDate}
                      onChange={e => { setReminderDate(e.target.value); setErrors(p => ({ ...p, reminderDate: undefined })); }}
                      style={{ fontSize: 13 }}
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      type="time"
                      className="input"
                      value={reminderTime}
                      onChange={e => setReminderTime(e.target.value)}
                      style={{ fontSize: 13 }}
                    />
                  </Field>
                </div>

                {/* Reminder method */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
                    How to remind me <span style={{ color: 'var(--negative)', marginLeft: 2 }}>*</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {REMINDER_METHODS.map(m => (
                      <label
                        key={m.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${reminderMethods.includes(m.value) ? 'var(--ink-1)' : 'var(--border)'}`,
                          background: reminderMethods.includes(m.value) ? 'var(--bg-subtle)' : 'transparent',
                          transition: 'all 120ms',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={reminderMethods.includes(m.value)}
                          onChange={() => { toggleMethod(m.value); setErrors(p => ({ ...p, reminderMethods: undefined })); }}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${reminderMethods.includes(m.value) ? 'var(--ink-1)' : 'var(--border-strong)'}`,
                          background: reminderMethods.includes(m.value) ? 'var(--ink-1)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 120ms',
                        }}>
                          {reminderMethods.includes(m.value) && <Icon name="check" size={10} strokeWidth={3} color="white"/>}
                        </div>
                        <Icon name={m.icon} size={14} color={reminderMethods.includes(m.value) ? 'var(--ink-1)' : 'var(--ink-3)'}/>
                        <span style={{ fontSize: 13, color: reminderMethods.includes(m.value) ? 'var(--ink-1)' : 'var(--ink-2)' }}>
                          {m.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.reminderMethods && (
                    <div style={{ fontSize: 11, color: 'var(--negative)', marginTop: 5 }}>{errors.reminderMethods}</div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={adding || !title.trim()}>
              {adding ? 'Adding…' : 'Add task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
        {label}
        {required && <span style={{ color: 'var(--negative)', marginLeft: 2 }}>*</span>}
      </label>
    )}
    {children}
    {error && <div style={{ fontSize: 11, color: 'var(--negative)' }}>{error}</div>}
  </div>
);

const Switch = ({ on }) => (
  <div style={{
    width: 36, height: 20, borderRadius: 10,
    background: on ? 'var(--ink-1)' : 'var(--border-strong)',
    position: 'relative', transition: 'background 150ms', flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 16, height: 16, borderRadius: '50%',
      background: 'white', transition: 'left 150ms',
    }}/>
  </div>
);

const ToggleChip = ({ active, onToggle, icon, label, activeColor = 'var(--ink-1)' }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
      borderRadius: 8, border: `1.5px solid ${active ? activeColor : 'var(--border)'}`,
      background: active ? activeColor : 'transparent',
      color: active ? 'white' : 'var(--ink-3)',
      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
      whiteSpace: 'nowrap',
    }}
  >
    <Icon name={icon} size={13} color={active ? 'white' : 'var(--ink-3)'}/>
    {label}
  </button>
);

// ─── Main Tasks component ────────────────────────────────────────────────────
export const Tasks = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);

  const loadTasks = React.useCallback(() => {
    if (!business?.id) { setLoading(false); return; }
    if (isDemo) {
      setTasks(demoTaskStore.get(business.id));
      setLoading(false);
      return;
    }
    AtlasAPI.tasks.list(business.id)
      .then(list => setTasks(list || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [business?.id, isDemo]);

  React.useEffect(() => { loadTasks(); }, [loadTasks]);

  React.useEffect(() => {
    if (!isDemo) return;
    const interval = setInterval(() => {
      const fresh = demoTaskStore.get(business.id);
      setTasks(prev => {
        if (prev.length !== fresh.length) return [...fresh];
        const changed = fresh.some((t, i) => t.id !== prev[i]?.id || t.status !== prev[i]?.status);
        return changed ? [...fresh] : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isDemo, business?.id]);

  const handleStatusChange = async (task, newStatus) => {
    setActing(task.id);
    try {
      if (isDemo) {
        if (newStatus === 'deleted') {
          demoTaskStore.remove(business.id, task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        } else {
          demoTaskStore.update(business.id, task.id, newStatus);
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        }
      } else {
        if (newStatus === 'deleted') {
          await AtlasAPI.tasks.delete(business.id, task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        } else {
          await AtlasAPI.tasks.updateStatus(business.id, task.id, newStatus);
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        }
      }
    } catch (err) {
      console.error('Task action failed', err);
    } finally {
      setActing(null);
    }
  };

  const handleAddTask = async (payload) => {
    try {
      if (isDemo) {
        const task = demoTaskStore.makeTask(business.id, payload, 'task');
        // Merge extra fields that makeTask doesn't know about
        const enriched = {
          ...task,
          description: payload.description ?? task.description,
          urgent:      payload.urgent      ?? task.urgent,
          dueDate:     payload.dueDate     ?? task.dueDate,
          reminder:    payload.reminder,
        };
        demoTaskStore.add(business.id, enriched);
        setTasks(demoTaskStore.list(business.id));
      } else {
        const task = await AtlasAPI.tasks.create(business.id, payload);
        setTasks(prev => [task, ...prev]);
      }
      setShowAdd(false);
      // Schedule browser notification if requested
      if (payload.reminder?.methods?.includes('notification') && payload.reminder?.at) {
        scheduleNotification(payload.title, payload.reminder.at);
      }
    } catch (err) {
      console.error('Add task failed', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <SectionHeader eyebrow="To Do" title="Tasks" subtitle="Action items from insights and recommendations."/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 8 }}/>)}
        </div>
      </div>
    );
  }

  const pending   = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <>
      {showAdd && (
        <AddTaskModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAddTask}
        />
      )}

      <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="To Do"
          title="Tasks"
          subtitle={`${pending.length} active · ${completed.length} completed`}
          action={
            <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}>
              <Icon name="plus" size={13}/> Add task
            </button>
          }
        />

        {tasks.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="check-square" size={32} color="var(--ink-4)"/>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 16, marginBottom: 8 }}>No tasks yet</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 320, margin: '0 auto 20px' }}>
              Click "Apply suggestion" or "Create task" on any action in the Overview, or add one manually.
            </div>
            <button className="btn btn-sm" onClick={() => setShowAdd(true)}>
              <Icon name="plus" size={13}/> Add a task
            </button>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Active — {pending.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pending.map(task => (
                    <TaskRow key={task.id} task={task} acting={acting} onStatusChange={handleStatusChange}/>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Completed — {completed.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
                  {completed.map(task => (
                    <TaskRow key={task.id} task={task} acting={acting} onStatusChange={handleStatusChange}/>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// ─── Browser notification scheduler ─────────────────────────────────────────
function scheduleNotification(title, isoAt) {
  if (!('Notification' in window)) return;
  const delay = new Date(isoAt).getTime() - Date.now();
  if (delay <= 0) return;

  const fire = () => {
    if (Notification.permission === 'granted') {
      new Notification('Atlas Task Reminder', { body: title, icon: '/favicon.ico' });
    }
  };

  if (Notification.permission === 'granted') {
    setTimeout(fire, delay);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') setTimeout(fire, delay);
    });
  }
}

// ─── Task row (unchanged behaviour, renders reminder badge) ─────────────────
const TaskRow = ({ task, acting, onStatusChange }) => {
  const isDone      = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isUrgent    = task.urgent;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
  const isActing    = acting === task.id;

  const dueDate   = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isDone;
  const dueDateStr = dueDate
    ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  const reminderAt = task.reminder?.at ? new Date(task.reminder.at) : null;
  const reminderStr = reminderAt
    ? reminderAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="card" style={{
      padding: '14px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 14,
      borderColor: isUrgent && !isDone ? 'var(--ink-1)' : 'var(--border)',
      opacity: isDone ? 0.7 : 1,
    }}>
      {/* Checkbox */}
      <button
        style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
          border: `2px solid ${isDone ? 'var(--positive)' : 'var(--border-strong)'}`,
          background: isDone ? 'var(--positive)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 120ms',
        }}
        disabled={isActing}
        onClick={() => onStatusChange(task, isDone ? 'pending' : 'completed')}
        title={isDone ? 'Mark as pending' : 'Mark as complete'}
      >
        {isDone && <Icon name="check" size={11} strokeWidth={3} color="white"/>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--ink-3)' : 'var(--ink-1)' }}>
            {task.title}
          </span>
          {isUrgent && !isDone && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#dc2626', color: 'white', fontWeight: 600, letterSpacing: '0.04em' }}>URGENT</span>
          )}
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}>
            {statusStyle.label}
          </span>
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55, marginBottom: 6 }}>{task.description}</div>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' }}>
          {task.impact && <span style={{ color: 'var(--ink-4)' }}>Impact: <strong style={{ color: 'var(--ink-2)' }}>{task.impact}</strong></span>}
          {task.effort && <span style={{ color: 'var(--ink-4)' }}>Effort: <strong style={{ color: 'var(--ink-2)' }}>{task.effort}</strong></span>}
          {dueDateStr && (
            <span style={{ color: isOverdue ? 'var(--negative)' : 'var(--ink-4)' }}>
              {isOverdue ? '⚠ Overdue · ' : 'Due: '}
              <strong style={{ color: isOverdue ? 'var(--negative)' : 'var(--ink-2)' }}>{dueDateStr}</strong>
            </span>
          )}
          {reminderStr && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-4)' }}>
              <Icon name="bell" size={10} color="var(--ink-4)"/>
              <span>Reminder: <strong style={{ color: 'var(--ink-2)' }}>{reminderStr}</strong></span>
              {task.reminder?.methods?.map(m => {
                const icons = { notification: 'bell', email: 'mail', in_app: 'message-square' };
                return <Icon key={m} name={icons[m] || 'bell'} size={10} color="var(--ink-3)" title={m}/>;
              })}
            </span>
          )}
          {task.createdAt && (
            <span style={{ color: 'var(--ink-4)' }}>
              Created {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!isDone && !isInProgress && (
          <button
            className="btn btn-sm"
            style={{ fontSize: 11 }}
            disabled={isActing}
            onClick={() => onStatusChange(task, 'in_progress')}
          >
            Start
          </button>
        )}
        {isInProgress && (
          <button
            className="btn btn-success btn-sm"
            style={{ fontSize: 11 }}
            disabled={isActing}
            onClick={() => onStatusChange(task, 'completed')}
          >
            <Icon name="check" size={11}/> Done
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 6px' }}
          disabled={isActing}
          title="Delete task"
          onClick={() => onStatusChange(task, 'deleted')}
        >
          <Icon name="x" size={12} color="var(--ink-4)"/>
        </button>
      </div>
    </div>
  );
};
