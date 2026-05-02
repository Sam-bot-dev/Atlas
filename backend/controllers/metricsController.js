const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { forecastRevenue } = require('../services/mlService');

// @desc    Get all metrics for a business
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

  const metrics = await prisma.metric.findMany({
    where: { businessId: req.params.bizId },
  });

  // Transform into the summary shape the frontend expects
  const summary = {};
  metrics.forEach((m) => {
    summary[m.key] = {
      value: m.value,
      delta: m.delta,
      label: m.label,
      unit: m.unit,
      period: m.period,
    };
  });

  res.json(summary);
});

// @desc    Upsert a metric for a business
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

// @desc    Get metrics forecast
// @route   GET /api/v1/businesses/:bizId/metrics/forecast
// @access  Private
const getForecast = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const forecast = await forecastRevenue(req.params.bizId);
  res.json(forecast);
});

module.exports = {
  getMetrics,
  upsertMetric,
  getForecast,
};
