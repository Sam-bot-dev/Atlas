const { listTasks, updateTaskStatus } = require('../services/taskService');

const getTasks = async (req, res) => {
  try {
    const tasks = await listTasks(req.params.bizId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const patchTaskStatus = async (req, res) => {
  try {
    const task = await updateTaskStatus(req.params.taskId, req.params.bizId, req.body.status);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTasks,
  patchTaskStatus,
};

