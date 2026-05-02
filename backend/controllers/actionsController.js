const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { generateActions } = require('../services/actionService');
const { calculateMetrics } = require('../services/metricService');
const { generateInsights } = require('../services/insightService');

// @desc    Get all actions for a business (with AI generation)
// @route   GET /api/v1/businesses/:bizId/actions
// @access  Private
const getActions = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  // Generate fresh actions if none exist or if older than 6 hours
  const recentActions = await prisma.action.findMany({
    where: {
      businessId: req.params.bizId,
      createdAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    },
  });

  if (recentActions.length === 0) {
    // Generate new actions
    const metrics = await calculateMetrics(req.params.bizId);
    const insightsData = await prisma.insight.findMany({
      where: { businessId: req.params.bizId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const insights = insightsData.map((i) => ({
      ...i,
      evidence: JSON.parse(i.evidence),
    }));
    await generateActions(req.params.bizId, metrics, insights);
  }

  // Fetch actions
  const actions = await prisma.action.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json(
    actions.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      impact: a.impact,
      effort: a.effort,
      confidence: a.confidence,
      urgent: a.urgent,
      status: a.status,
      createdAt: a.createdAt,
    })),
  );
});

// @desc    Create an action for a business (manual)
// @route   POST /api/v1/businesses/:bizId/actions
// @access  Private
const createAction = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const { title, body, impact, effort, confidence, urgent } = req.body;

  if (!title || !body) {
    res.status(400);
    throw new Error('Title and body are required');
  }

  const action = await prisma.action.create({
    data: {
      title,
      body,
      impact: impact || 'Medium',
      effort: effort || 'Medium',
      confidence: confidence || 'Medium',
      urgent: urgent || false,
      businessId: req.params.bizId,
    },
  });

  res.status(201).json(action);
});

// @desc    Update an action's status
// @route   PATCH /api/v1/businesses/:bizId/actions/:actionId
// @access  Private
const updateAction = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const existing = await prisma.action.findFirst({
    where: { id: req.params.actionId, businessId: req.params.bizId },
  });

  if (!existing) {
    res.status(404);
    throw new Error('Action not found');
  }

  const { status } = req.body;

  const updated = await prisma.action.update({
    where: { id: req.params.actionId },
    data: { status: status || existing.status },
  });

  res.json(updated);
});

// @desc    Apply an action (start implementation)
// @route   POST /api/v1/businesses/:bizId/actions/:actionId/apply
// @access  Private
const applyAction = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const existing = await prisma.action.findFirst({
    where: { id: req.params.actionId, businessId: req.params.bizId },
  });

  if (!existing) {
    res.status(404);
    throw new Error('Action not found');
  }

  const updated = await prisma.action.update({
    where: { id: req.params.actionId },
    data: { status: 'in_progress' },
  });

  res.json(updated);
});

module.exports = {
  getActions,
  createAction,
  updateAction,
  applyAction,
};
