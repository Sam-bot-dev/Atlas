const { prisma } = require('../lib/prisma');

/**
 * Task Management Service
 * Handles user-facing tasks (auto-generated or manual)
 */

async function createTask({ businessId, title, description, dueDate, actionId }) {
  return prisma.task.create({
    data: {
      businessId,
      title,
      description: description || '',
      dueDate: dueDate || null,
      actionId: actionId || null,
    },
  });
}

async function listTasks(businessId) {
  return prisma.task.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateTaskStatus(taskId, businessId, status) {
  // Uses updateMany to safely enforce business boundary without a findFirst call
  await prisma.task.updateMany({
    where: { id: taskId, businessId },
    data: { status },
  });

  return prisma.task.findFirst({
    where: { id: taskId, businessId },
  });
}

module.exports = {
  createTask,
  listTasks,
  updateTaskStatus,
};
