const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { generateInsights } = require('../services/insightService');
const { calculateMetrics } = require('../services/metricService');

// @desc    Get all insights for a business (with AI generation)
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

  // Generate fresh insights if none exist or if older than 6 hours
  const recentInsights = await prisma.insight.findMany({
    where: {
      businessId: req.params.bizId,
      createdAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    },
  });

  if (recentInsights.length === 0) {
    // Generate new insights
    const metrics = await calculateMetrics(req.params.bizId);
    await generateInsights(req.params.bizId, metrics);
  }

  // Fetch insights
  const insights = await prisma.insight.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json(
    insights.map((i) => ({
      id: i.id,
      title: i.title,
      body: i.body,
      severity: i.severity,
      evidence: JSON.parse(i.evidence),
      createdAt: i.createdAt,
    })),
  );
});

// @desc    Create an insight for a business (manual)
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

  res.status(201).json({
    id: insight.id,
    title: insight.title,
    body: insight.body,
    severity: insight.severity,
    evidence: JSON.parse(insight.evidence),
    createdAt: insight.createdAt,
  });
});

module.exports = {
  getInsights,
  createInsight,
};
