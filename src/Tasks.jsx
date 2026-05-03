import React from 'react';
import { SectionHeader, SkeletonLine, Icon } from './ui';
import { AtlasAPI } from './api';

export const Tasks = ({ business, onRefresh }) => {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    AtlasAPI.tasks.list(business.id).then(setTasks).catch(console.error).finally(() => setLoading(false));
  }, [business?.id]);

  if (loading) return <div style={{ padding: 64 }}><SkeletonLine style={{ width: 300 }} /></div>;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="To Do" title="Tasks" subtitle="Action items from insights and automations."/>
      <div className="card" style={{ padding: 18 }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{task.description}</div>
                {task.dueDate && <div style={{ fontSize: 11, color: 'var(--warning)' }}>Due {new Date(task.dueDate).toLocaleDateString()}</div>}
              </div>
              <button className="btn btn-success btn-sm">Complete</button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>
            No tasks yet. Actions will create tasks here.
          </div>
        )}
      </div>
    </div>
  );
};
