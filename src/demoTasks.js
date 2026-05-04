/**
 * demoTasks.js — In-memory task store for demo businesses
 *
 * Demo businesses have no backend, so when a user clicks "Apply suggestion"
 * or "Create task" on the Overview page, tasks need to live somewhere the
 * Tasks tab can also read them within the same session.
 *
 * The Tasks.jsx component checks this store for demo business IDs.
 */

// Per-business task lists stored in a module-level Map so they survive
// React re-renders and component unmounts within the same browser session.
const store = new Map(); // bizId → Task[]

let nextId = 1;

/**
 * Build a Task object from an action card + type.
 * @param {string} bizId
 * @param {object} actionObj  - action from actions array (title, body, impact, effort, urgent)
 * @param {'apply'|'task'} type
 * @returns {object} task
 */
function makeTask(bizId, actionObj, type) {
  const urgencyDays = actionObj.urgent ? 2 : 7;
  const dueDate = new Date(Date.now() + urgencyDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `demo-task-${nextId++}`,
    businessId: bizId,
    title: type === 'task'
      ? actionObj.title
      : `[In Progress] ${actionObj.title}`,
    description: actionObj.body,
    impact: actionObj.impact,
    effort: actionObj.effort,
    urgent: actionObj.urgent || false,
    status: type === 'task' ? 'pending' : 'in_progress',
    dueDate,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Add a task to the store for a given business.
 * @param {string} bizId
 * @param {object} task
 */
function add(bizId, task) {
  if (!store.has(bizId)) store.set(bizId, []);
  store.get(bizId).unshift(task); // most-recent first
}

/**
 * List tasks for a given business.
 * @param {string} bizId
 * @returns {object[]}
 */
function list(bizId) {
  return store.get(bizId) || [];
}

/**
 * Mark a task as completed and remove it from the list.
 * @param {string} bizId
 * @param {string} taskId
 */
function complete(bizId, taskId) {
  const tasks = store.get(bizId) || [];
  store.set(bizId, tasks.filter(t => t.id !== taskId));
}

/**
 * Remove a task entirely.
 * @param {string} bizId
 * @param {string} taskId
 */
function remove(bizId, taskId) {
  complete(bizId, taskId); // same operation
}

export const demoTaskStore = { makeTask, add, list, complete, remove };
