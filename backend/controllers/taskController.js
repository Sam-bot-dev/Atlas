/* eslint-env node */
const { prisma } = require('../lib/prisma');
const { listTasks, updateTaskStatus, createTask, deleteTask: deleteTaskService } = require('../services/taskService');

/** Verify the business belongs to the requesting user */
const ensureOwnership = async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return null;
  }
  return business;
};

/** @param {import('express').Request} req @param {import('express').Response} res */
const getTasks = async (req, res) => {
  if (!await ensureOwnership(req, res)) return;
  try {
    const tasks = await listTasks(req.params.bizId);
    res.json(tasks);
  } catch (/** @type {any} */ error) {
    res.status(500).json({ error: error.message });
  }
};

/** @param {import('express').Request} req @param {import('express').Response} res */
const patchTaskStatus = async (req, res) => {
  if (!await ensureOwnership(req, res)) return;
  const allowed = ['pending', 'completed'];
  const status = req.body.status;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
  }
  try {
    const task = await updateTaskStatus(req.params.taskId, req.params.bizId, status);
    res.json(task);
  } catch (/** @type {any} */ error) {
    res.status(500).json({ error: error.message });
  }
};

/** @param {import('express').Request} req @param {import('express').Response} res */
const postTask = async (req, res) => {
  if (!await ensureOwnership(req, res)) return;
  const { title, description, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const task = await createTask({ businessId: req.params.bizId, title, description, dueDate });
    res.status(201).json(task);
  } catch (/** @type {any} */ error) {
    res.status(500).json({ error: error.message });
  }
};

/** @param {import('express').Request} req @param {import('express').Response} res */
const deleteTaskHandler = async (req, res) => {
  if (!await ensureOwnership(req, res)) return;
  try {
    const result = await deleteTaskService(req.params.taskId, req.params.bizId);
    // deleteMany returns { count: number } - convert to a more informative response
    res.json({ id: req.params.taskId, deleted: result.count > 0 });
  } catch (/** @type {any} */ error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getTasks, patchTaskStatus, postTask, deleteTask: deleteTaskHandler };
