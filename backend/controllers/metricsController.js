const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { forecastRevenue } = require('../services/mlService');
const { calculatePeakHours } = require('../services/metricService');

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

const getMetricSeries = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const key = `${req.params.metric}Series`;
  let series = [];
  try {
    series = JSON.parse(business[key] || '[]');
  } catch {
    series = [];
  }

  res.json({ metric: req.params.metric, period: req.query.period || '6M', series });
});

const getPeakHours = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const matrix = await calculatePeakHours(req.params.bizId);
  res.json({ matrix });
});

// @desc    Import metrics from Excel file for all businesses
// @route   POST /api/v1/businesses/:bizId/metrics/import-excel
// @access  Private
const importMetricsFromExcel = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Excel file is required');
  }

  const readExcelFile = require('read-excel-file/node');
  
  try {
    // Read the Excel file
    const rows = await readExcelFile(req.file.path);
    
    if (!rows || rows.length < 2) {
      res.status(400);
      throw new Error('Excel file must have a header row and at least one data row');
    }

    const headers = rows[0].map(h => h?.toString().toLowerCase().trim());
    const updates = [];

    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.every(cell => cell === null || cell === undefined)) {
        const rowData = {};
        headers.forEach((header, idx) => {
          if (header) rowData[header] = row[idx];
        });

        // Update the current business with the data
        const businessName = rowData['business name'] || rowData['name'];
        const revenue = parseFloat(rowData['revenue']) || 0;
        const revenueGrowth = parseFloat(rowData['revenue growth']) || 0;
        const orders = parseInt(rowData['orders']) || 0;
        const customers = parseInt(rowData['customers']) || 0;
        const customerGrowth = parseFloat(rowData['customer growth']) || 0;

        // Update business metrics
        const updatedBiz = await prisma.business.update({
          where: { id: req.params.bizId },
          data: {
            revenueSeries: JSON.stringify([
              ...JSON.parse(business.revenueSeries || '[]'),
              { d: new Date().toISOString().split('T')[0], v: revenue }
            ].slice(-30)), // Keep last 30 days
            ordersSeries: JSON.stringify([
              ...JSON.parse(business.ordersSeries || '[]'),
              { d: new Date().toISOString().split('T')[0], v: orders }
            ].slice(-30)),
            customerGrowth: JSON.stringify([
              ...JSON.parse(business.customerGrowth || '[]'),
              { d: new Date().toISOString().split('T')[0], v: customers }
            ].slice(-30)),
          },
        });

        // Update metrics table
        await Promise.all([
          prisma.metric.upsert({
            where: {
              businessId_key: { businessId: req.params.bizId, key: 'revenue' }
            },
            update: { value: revenue, delta: revenueGrowth, unit: '₹', period: 'vs last period' },
            create: {
              businessId: req.params.bizId,
              key: 'revenue',
              value: revenue,
              delta: revenueGrowth,
              unit: '₹',
              period: 'vs last period',
              label: 'Revenue'
            }
          }),
          prisma.metric.upsert({
            where: {
              businessId_key: { businessId: req.params.bizId, key: 'orders' }
            },
            update: { value: orders, unit: '', period: 'this week' },
            create: {
              businessId: req.params.bizId,
              key: 'orders',
              value: orders,
              unit: '',
              period: 'this week',
              label: 'Orders'
            }
          }),
          prisma.metric.upsert({
            where: {
              businessId_key: { businessId: req.params.bizId, key: 'customers' }
            },
            update: { value: customers, delta: customerGrowth, unit: '', period: 'total' },
            create: {
              businessId: req.params.bizId,
              key: 'customers',
              value: customers,
              delta: customerGrowth,
              unit: '',
              period: 'total',
              label: 'Customers'
            }
          })
        ]);

        updates.push({
          businessName: business.name,
          revenue,
          revenueGrowth,
          orders,
          customers,
          customerGrowth,
          status: 'updated'
        });
      }
    }

    res.json({
      message: 'Metrics imported successfully',
      totalUpdated: updates.length,
      updates,
    });
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to import Excel: ${error.message}`);
  }
});

module.exports = {
  getMetrics,
  upsertMetric,
  getForecast,
  getMetricSeries,
  getPeakHours,
  importMetricsFromExcel,
};
