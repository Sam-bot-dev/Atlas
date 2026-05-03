const { prisma } = require('../lib/prisma');
const { dispatchWebhook } = require('./webhookService');
const { sendEmailAlert } = require('./notificationService');
const { createTask } = require('./taskService');

/**
 * Automations Engine
 * Evaluates triggers and maps them to concrete execution steps
 */

/**
 * @param {string} businessId
 * @param {string} triggerEvent
 * @param {any} payloadData
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
    let payloadInfo = {};
    try { payloadInfo = JSON.parse(auto.payload || '{}'); } catch { /* malformed payload — skip */ }
    
    if (auto.actionType === 'email_alert') {
      await sendEmailAlert(payloadInfo.to || ownerEmail, `Alert: ${triggerEvent}`, JSON.stringify(payloadData));
    } else if (auto.actionType === 'webhook_post') {
      if (payloadInfo.url) {
        await dispatchWebhook(payloadInfo.url, { trigger: triggerEvent, data: payloadData });
      }
    } else if (auto.actionType === 'create_task') {
      await createTask(/** @type {any} */({
        businessId,
        title: `Auto-generated task from trigger: ${triggerEvent}`,
        description: 'System generated automation execution.',
      }));
    }

    await prisma.automation.update({
      where: { id: auto.id },
      data: { lastRunAt: new Date() },
    });
  }
}

/**
 * @param {{ businessId: string, trigger: string, actionType: string, payload?: any }} options
 */
async function createAutomation(options) {
  const { businessId, trigger, actionType, payload } = options;
  return prisma.automation.create({
    data: {
      businessId,
      trigger,
      actionType,
      payload: JSON.stringify(payload || {}),
    },
  });
}

/**
 * @param {string} businessId
 */
async function getSuggestedAutomations(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      metrics: true,
      inventory: true
    }
  });

  // Fix: null-check before accessing relations — an invalid businessId returns
  // null from findUnique, and accessing .inventory/.metrics on null throws.
  if (!business) return [];

  const suggestions = [];

  // Data-driven (8.5)
  const inventory = /** @type {any[]} */ (business.inventory || []);
  const lowStock = inventory.filter(/** @param {any} i */ i => i.quantityOnHand <= i.reorderPoint).length;
  if (lowStock > 0) {
    suggestions.push({
      trigger: 'inventory_low',
      action: 'email_alert',
      title: `Low stock alert: ${lowStock} items need reorder`
    });
  }

  const revenueMetric = /** @type {any} */ (business.metrics.find(/** @param {any} m */ m => m.key === 'revenue'));
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
