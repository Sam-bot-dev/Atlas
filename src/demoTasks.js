// Shared in-memory task store for demo businesses.
// Tasks created from Overview actions persist here and are readable by Tasks.jsx.

const store = {}; // { [bizId]: Task[] }

export const demoTaskStore = {
  get: (bizId) => store[bizId] || [],

  add: (bizId, task) => {
    if (!store[bizId]) store[bizId] = [];
    // Avoid duplicates by id
    if (store[bizId].some(t => t.id === task.id)) return task;
    store[bizId].unshift(task);
    return task;
  },

  update: (bizId, taskId, newStatus) => {
    if (!store[bizId]) return;
    store[bizId] = store[bizId].map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
  },

  // Keep for backwards compat
  complete: (bizId, taskId) => {
    demoTaskStore.update(bizId, taskId, 'completed');
  },

  remove: (bizId, taskId) => {
    if (!store[bizId]) return;
    store[bizId] = store[bizId].filter(t => t.id !== taskId);
  },

  makeTask: (bizId, action, type = 'task') => ({
    id: `demo-task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    businessId: bizId,
    title: type === 'apply' ? `[In Progress] ${action.title}` : action.title,
    description: action.body,
    impact: action.impact,
    effort: action.effort,
    confidence: action.confidence,
    urgent: action.urgent || false,
    status: type === 'apply' ? 'in_progress' : 'pending',
    type,
    createdAt: new Date().toISOString(),
    dueDate: action.urgent
      ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // urgent → 2 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // normal → 7 days
  }),
};
