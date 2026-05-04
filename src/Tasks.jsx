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

export const Tasks = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(null); // taskId being acted on
  const [showAdd, setShowAdd] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  // Load tasks — demo reads from in-memory store, real from API
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

  // Poll demo store every 3s so tasks created from Overview/Automations appear
  React.useEffect(() => {
    if (!isDemo) return;
    const interval = setInterval(() => {
      const fresh = demoTaskStore.get(business.id);
      setTasks(prev => {
        // Only update if something actually changed (avoids flicker)
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      if (isDemo) {
        const task = demoTaskStore.makeTask(business.id, { title }, 'task');
        demoTaskStore.add(business.id, task);
        setTasks(demoTaskStore.list(business.id));
      } else {
        const task = await AtlasAPI.tasks.create(business.id, { title });
        setTasks(prev => [task, ...prev]);
      }
      setNewTitle('');
      setShowAdd(false);
    } catch (err) {
      console.error('Add task failed', err);
    } finally {
      setAdding(false);
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

  const pending     = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completed   = tasks.filter(t => t.status === 'completed');

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="To Do"
        title="Tasks"
        subtitle={`${pending.length} active · ${completed.length} completed`}
        action={
          <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(p => !p)}>
            <Icon name="plus" size={13}/> Add task
          </button>
        }
      />

      {showAdd && (
        <form onSubmit={handleAddTask} style={{ marginBottom: 16 }}>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              autoFocus
              className="input"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="Task title…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary" disabled={adding || !newTitle.trim()}>
              {adding ? 'Adding…' : 'Add'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setShowAdd(false); setNewTitle(''); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

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
  );
};

const TaskRow = ({ task, acting, onStatusChange }) => {
  const isDone = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isUrgent = task.urgent;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
  const isActing = acting === task.id;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isDone;
  const dueDateStr = dueDate
    ? dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
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
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--ink-1)', color: 'white', fontWeight: 600, letterSpacing: '0.04em' }}>URGENT</span>
          )}
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}>
            {statusStyle.label}
          </span>
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>{task.description}</div>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, flexWrap: 'wrap' }}>
          {task.impact && <span style={{ color: 'var(--ink-4)' }}>Impact: <strong style={{ color: 'var(--ink-2)' }}>{task.impact}</strong></span>}
          {task.effort && <span style={{ color: 'var(--ink-4)' }}>Effort: <strong style={{ color: 'var(--ink-2)' }}>{task.effort}</strong></span>}
          {dueDateStr && (
            <span style={{ color: isOverdue ? 'var(--negative)' : 'var(--ink-4)' }}>
              {isOverdue ? '⚠ Overdue · ' : 'Due: '}
              <strong style={{ color: isOverdue ? 'var(--negative)' : 'var(--ink-2)' }}>{dueDateStr}</strong>
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
