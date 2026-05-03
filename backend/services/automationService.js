const { prisma } = require('../lib/prisma');
const { dispatchWebhook } = require('./webhookService');
const { sendEmailAlert } = require('./notificationService');
const { createTask } = require('./taskService');

/**
 * Automations Engine
 * Evaluates triggers and maps them to concrete execution steps
 */

async function evaluateAutomations(businessId, triggerEvent, payloadData) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { user: true }
  });
  const ownerEmail = business?.user?.email || 'owner@business.com';

  const automations = await prisma.automation.findMany({
    where: { businessId, status: 'active', trigger: triggerEvent },
  });

  for (const auto of automations) {
    const payloadInfo = JSON.parse(auto.payload || '{}');
    
    if (auto.actionType === 'email_alert') {
      await sendEmailAlert(payloadInfo.to || ownerEmail, `Alert: ${triggerEvent}`, JSON.stringify(payloadData));
    } else if (auto.actionType === 'webhook_post') {
      if (payloadInfo.url) {
        await dispatchWebhook(payloadInfo.url, { trigger: triggerEvent, data: payloadData });
      }
    } else if (auto.actionType === 'create_task') {
      await createTask({
        businessId,
        title: `Auto-generated task from trigger: ${triggerEvent}`,
        description: 'System generated automation execution.',
      });
    }

    await prisma.automation.update({
      where: { id: auto.id },
      data: { lastRunAt: new Date() },
    });
  }
}

async function createAutomation({ businessId, trigger, actionType, payload }) {
  return prisma.automation.create({
    data: {
      businessId,
      trigger,
      actionType,
      payload: JSON.stringify(payload || {}),
    },
  });
}

async function getSuggestedAutomations(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      metrics: true,
      inventory: true
    }
  });

  const suggestions = [];

  // Data-driven (8.5)
  const inventory = business.inventory || [];
  const lowStock = inventory.filter(i => i.quantityOnHand <= i.reorderPoint).length;
  if (lowStock > 0) {
    suggestions.push({
      trigger: 'inventory_low',
      action: 'email_alert',
      title: `Low stock alert: ${lowStock} items need reorder`
    });
  }

  const revenueMetric = business.metrics.find(m => m.key === 'revenue');
  if (revenueMetric && revenueMetric.delta < -10) {
    suggestions.push({
      trigger: 'revenue_drop',
      action: 'create_task',
      title: `Revenue down ${Math.abs(revenueMetric.delta)}% - investigate`
    });
  }

  // Fallback category-based
  const type = `${business?.type || business?.category || ''}`.toLowerCase();
  if (/cafe|baker|retail|pharmacy/.test(type)) {
    suggestions.push({ trigger: 'negative_review', action: 'create_task', title: 'Task to review bad feedback' });
  }

  return suggestions.slice(0, 3);
}

module.exports = {
  evaluateAutomations,
  createAutomation,
  getSuggestedAutomations,
};
