const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { createAutomation, getSuggestedAutomations, evaluateAutomations } = require('../services/automationService');

const listAutomations = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!business) { res.status(404); throw new Error('Business not found'); }

  const automations = await prisma.automation.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(automations);
});

const toggleAutomation = asyncHandler(async (req, res) => {
  // Ownership check: ensure the automation belongs to a business owned by this user
  const auto = await prisma.automation.findFirst({
    where: {
      id: req.params.autoId,
      businessId: req.params.bizId,
      business: { userId: req.user.id },
    },
  });
  if (!auto) { res.status(404); throw new Error('Automation not found'); }

  // Fix #25: backend was toggling to 'paused' but schema only has 'active'/'disabled'.
  // Frontend AutomationToggle also now uses 'disabled' to match.
  const updated = await prisma.automation.update({
    where: { id: req.params.autoId },
    data: { status: auto.status === 'active' ? 'disabled' : 'active' },
  });
  res.json(updated);
});

const addAutomation = asyncHandler(async (req, res) => {
  const { trigger, action } = req.body;

  if (!trigger || !action) {
    res.status(400);
    throw new Error('trigger and action are required');
  }

  // Fix #26: verify the business belongs to the requesting user
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!business) { res.status(403); throw new Error('Forbidden: business not owned by user'); }
  
  const created = await createAutomation({
    businessId: req.params.bizId,
    trigger,
    actionType: action,
    payload: {},
  });
  res.status(201).json(created);
});

const deleteAutomation = asyncHandler(async (req, res) => {
  // Fix: ownership check was missing — anyone could delete any automation by ID
  const auto = await prisma.automation.findFirst({
    where: {
      id: req.params.autoId,
      businessId: req.params.bizId,
      business: { userId: req.user.id },
    },
  });
  if (!auto) { res.status(404); throw new Error('Automation not found'); }

  await prisma.automation.delete({ where: { id: req.params.autoId } });
  res.json({ id: req.params.autoId, deleted: true });
});

const suggestedAutomations = asyncHandler(async (req, res) => {
  res.json(await getSuggestedAutomations(req.params.bizId));
});

/**
 * POST /businesses/:bizId/automations/run
 * Evaluates all active automations for the business and returns an execution log.
 */
const runAutomations = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!business) { res.status(404); throw new Error('Business not found'); }

  // Get all active automations
  const automations = await prisma.automation.findMany({
    where: { businessId: req.params.bizId, status: 'active' },
  });

  const executionLog = [];

  for (const auto of automations) {
    try {
      // evaluateAutomations fires the actual side-effects (email, webhook, task)
      await evaluateAutomations(req.params.bizId, auto.trigger, { manual: true, triggeredBy: req.user.id });

      // Update lastRunAt
      await prisma.automation.update({
        where: { id: auto.id },
        data: { lastRunAt: new Date() },
      });

      executionLog.push({
        automationId: auto.id,
        trigger: auto.trigger,
        action: auto.actionType,
        status: 'executed',
        result: `${auto.actionType} triggered for: ${auto.trigger}`,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      executionLog.push({
        automationId: auto.id,
        trigger: auto.trigger,
        action: auto.actionType,
        status: 'error',
        result: err.message || 'Execution failed',
        ts: new Date().toISOString(),
      });
    }
  }

  res.json({ ran: executionLog.length, log: executionLog });
});

module.exports = {
  listAutomations,
  toggleAutomation,
  addAutomation,
  deleteAutomation,
  suggestedAutomations,
  runAutomations,
};
