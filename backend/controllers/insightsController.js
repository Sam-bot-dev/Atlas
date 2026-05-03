const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
// Fix #41: import both anomaly detector and the automations evaluator
const { detectAnomalies } = require('../services/mlService');
const { evaluateAutomations } = require('../services/automationService');
const { askAtlas } = require('../services/insightService');

// @desc    Get all insights for a business
// @route   GET /api/v1/businesses/:bizId/insights
// @access  Private
const getInsights = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const insights = await prisma.insight.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
  });

  // Fix #41: trigger anomaly detection in the background (non-blocking),
  // passing evaluateAutomations so insight-triggered automations actually fire.
  setImmediate(() => {
    detectAnomalies(req.params.bizId, evaluateAutomations).catch(err =>
      console.warn('[detectAnomalies] background check failed:', err.message)
    );
  });

  res.json(
    insights.map((i) => {
      let evidence = [];
      try {
        evidence = JSON.parse(i.evidence);
      } catch {
        // fallback empty array
      }
      return {
        id: i.id,
        title: i.title,
        body: i.body,
        severity: i.severity,
        evidence,
        createdAt: i.createdAt,
      };
    })
  );
});

// @desc    Create an insight for a business
// @route   POST /api/v1/businesses/:bizId/insights
// @access  Private
const createInsight = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const { title, body, severity, evidence } = req.body;

  if (!title || !body) {
    res.status(400);
    throw new Error('Title and body are required');
  }

  const insight = await prisma.insight.create({
    data: {
      title,
      body,
      severity: severity || 'info',
      evidence: evidence ? JSON.stringify(evidence) : '[]',
      businessId: req.params.bizId,
    },
  });

  // Fix #41: also run anomaly check after a new insight is saved
  setImmediate(() => {
    detectAnomalies(req.params.bizId, evaluateAutomations).catch(console.error);
  });

  res.status(201).json({
    id: insight.id,
    title: insight.title,
    body: insight.body,
    severity: insight.severity,
    evidence: (() => { try { return JSON.parse(insight.evidence || '[]'); } catch { return []; } })(),
    createdAt: insight.createdAt,
  });
});

const explainInsight = asyncHandler(async (req, res) => {
  const insight = await prisma.insight.findFirst({
    where: {
      id: req.params.insightId,
      businessId: req.params.bizId,
      business: { userId: req.user.id },
    },
  });

  if (!insight) {
    res.status(404);
    throw new Error('Insight not found');
  }

  let evidence = [];
  try {
    evidence = JSON.parse(insight.evidence || '[]');
  } catch {
    // fallback
  }

  // Fix #60: Use LLM to generate a real explanation instead of a generic string
  const explanation = await askAtlas(req.params.bizId, `Explain this insight in detail: "${insight.title}". ${insight.body}`);

  res.json({
    id: insight.id,
    answer: explanation.answer || explanation,
    evidence,
  });
});

module.exports = {
  getInsights,
  createInsight,
  explainInsight,
};
