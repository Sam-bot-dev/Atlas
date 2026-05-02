const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const {
  calculateMetrics,
  calculatePeakHours,
  saveMetrics,
} = require('../services/metricService');

// @desc    Get all metrics for a business (with real-time calculation)
// @route   GET /api/v1/businesses/:bizId/metrics
// @access  Private
const getMetrics = asyncHandler(async (req, res) => {
  // Verify ownership
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  // Calculate fresh metrics from data
  const metrics = await calculateMetrics(req.params.bizId);

  // Save to DB for reference
  await saveMetrics(req.params.bizId, metrics);

  // Calculate peak hours
  const peakHours = await calculatePeakHours(req.params.bizId);

  // Transform into the summary shape the frontend expects
  const summary = {
    revenue: metrics.revenue,
    orders: metrics.orders,
    conversion: metrics.conversion,
    inventory: metrics.inventory,
    retention: metrics.retention,
    sentiment: metrics.sentiment,
    peakHours,
    calculatedAt: metrics.calculatedAt,
  };

  res.json(summary);
});

// @desc    Upsert a metric for a business (manual override)
// @route   PUT /api/v1/businesses/:bizId/metrics/:key
// @access  Private
const upsertMetric = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const { value, delta, unit, period, label } = req.body;

  const metric = await prisma.metric.upsert({
    where: {
      businessId_key: {
        businessId: req.params.bizId,
        key: req.params.key,
      },
    },
    update: {
      value: value ?? 0,
      delta: delta ?? 0,
      unit: unit ?? '',
      period: period ?? '',
      label: label ?? '',
    },
    create: {
      key: req.params.key,
      value: value ?? 0,
      delta: delta ?? 0,
      unit: unit ?? '',
      period: period ?? '',
      label: label ?? '',
      businessId: req.params.bizId,
    },
  });

  res.json(metric);
});

module.exports = {
  getMetrics,
  upsertMetric,
};
