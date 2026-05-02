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
    select: { category: true, type: true },
  });
  const type = `${business?.type || business?.category || ''}`.toLowerCase();
  const suggestions = [
    { trigger: 'inventory_low', action: 'email_alert', title: 'Email on low stock' },
    { trigger: 'negative_review', action: 'create_task', title: 'Task to review bad feedback' },
  ];

  if (/cafe|baker|retail|pharmacy/.test(type)) {
    suggestions.push({ trigger: 'revenue_drop', action: 'create_task', title: 'Task on revenue drop' });
  }
  if (/import|export|service/.test(type)) {
    suggestions.push({ trigger: 'revenue_spike', action: 'email_alert', title: 'Email when revenue spikes' });
  }

  return suggestions;
}

module.exports = {
  evaluateAutomations,
  createAutomation,
  getSuggestedAutomations,
};
