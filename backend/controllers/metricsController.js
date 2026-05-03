const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { forecastRevenue } = require('../services/mlService');
const { calculatePeakHours } = require('../services/metricService');

// @desc    Get all metrics for a business
// @route   GET /api/v1/businesses/:bizId/metrics
// @access  Private
const getMetrics = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
    include: { metrics: true },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const period = req.query.period || '1M';

  // NEW: For demo businesses, return period-specific mock metrics
  if (business.isDemo) {
    // Generate realistic metrics that vary by period selection
    const periodMap = { '1W': 7, '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const days = periodMap[period] || 30;

    // Multipliers based on days relative to a 3-month (90-day) baseline
    const baseFactor = days / 90;
    const revenueFactor = Math.min(1.2, baseFactor * 0.8 + 0.2); // capped
    const ordersFactor = Math.min(1.2, baseFactor * 0.85 + 0.15);

    // Delta shrinks for shorter windows (recent volatility lower), grows for longer
    const deltaFactor = period === '1W' || period === '7D' ? 0.4 : period === '1M' ? 0.7 : 1.0;

    const seededMetrics = business.metrics || [];
    const summary = {};

    seededMetrics.forEach((metric) => {
      const baseValue = metric.value;
      let displayValue = baseValue;
      let displayDelta = metric.delta;

      if (metric.key === 'revenue') {
        displayValue = Math.round(baseValue * (0.3 + revenueFactor * 0.7)); // min 30%
        displayDelta = metric.delta * deltaFactor;
      } else if (metric.key === 'orders') {
        displayValue = Math.round(baseValue * (0.35 + ordersFactor * 0.65));
        displayDelta = metric.delta * deltaFactor;
      } else if (metric.key === 'conversion') {
        // Conversion rates vary less
        displayValue = Math.max(1, Math.min(10, baseValue + (period === '1W' ? 0.2 : period === '1Y' ? -0.5 : 0)));
        displayDelta = metric.delta * (deltaFactor * 0.5);
      } else if (metric.key === 'inventory') {
        displayValue = baseValue; // inventory health stays stable
        displayDelta = 0;
      } else if (metric.key === 'retention') {
        displayValue = baseValue;
        displayDelta = metric.delta * (deltaFactor * 0.3);
      } else if (metric.key === 'sentiment') {
        displayValue = baseValue; // sentiment stable
        displayDelta = 0;
      }

      summary[metric.key] = {
        value: displayValue,
        delta: displayDelta,
        label: metric.label,
        unit: metric.unit,
        period: period === '1W' || period === '7D' ? 'this week' : period === '1M' ? 'this month' : 'vs last period',
      };
    });

    return res.json(summary);
  }

  // Real businesses: return latest metrics (unchanged behavior)
  const metrics = await prisma.metric.findMany({
    where: { businessId: req.params.bizId },
  });

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

  // Fix: validate the key before hitting the DB. Without this any authenticated
  // user can insert arbitrary keys into the Metric table.
  const ALLOWED_METRIC_KEYS = ['revenue', 'orders', 'conversion', 'inventory', 'retention', 'sentiment', 'customers'];
  if (!ALLOWED_METRIC_KEYS.includes(req.params.key)) {
    res.status(400);
    throw new Error(`Invalid metric key. Allowed: ${ALLOWED_METRIC_KEYS.join(', ')}`);
  }

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

  const allowedMetrics = ['revenue', 'orders', 'customerGrowth', 'conversion', 'inventory', 'retention'];
  if (!allowedMetrics.includes(req.params.metric)) {
    res.status(400);
    throw new Error('Invalid metric. Allowed: ' + allowedMetrics.join(', '));
  }

  // Map metric name to the Business model field name
  const seriesFieldMap = {
    revenue: 'revenueSeries',
    orders: 'ordersSeries',
    customerGrowth: 'customerGrowth',
    conversion: 'revenueSeries', // fallback — no dedicated conversion series field
    inventory: 'revenueSeries',  // fallback
    retention: 'customerGrowth', // fallback
  };
  const key = seriesFieldMap[req.params.metric] || `${req.params.metric}Series`;
  let series = [];

  // Demo mode: return a subset of the base series based on period
  if (business.isDemo) {
    const raw = business[key];
    if (raw) {
      try {
        const fullSeries = JSON.parse(raw);
        const period = req.query.period || '6M';
        const map = { '1W': 1, '7D': 1, '1M': 2, '3M': 3, '6M': 5, '1Y': 7 };
        const n = map[period] || fullSeries.length;
        series = fullSeries.slice(-n);
      } catch {
        series = [];
      }
    }
  } else {
    // Real business — try stored series first, then fall back to deriving from normalized tables
    try {
      series = JSON.parse(business[key] || '[]');
    } catch {
      series = [];
    }

    // Fix #77: if no series stored, derive from relevant tables so charts render
    if (series.length === 0) {
      if (req.params.metric === 'revenue') {
        const orders = await prisma.order.findMany({
          where: { businessId: req.params.bizId, orderDate: { not: null } },
          orderBy: { orderDate: 'asc' },
        });
        const daily = {};
        orders.forEach(o => {
          const d = new Date(o.orderDate).toISOString().split('T')[0];
          daily[d] = (daily[d] || 0) + (o.total || 0);
        });
        series = Object.entries(daily).map(([d, v]) => ({ d, v }));
      } else if (req.params.metric === 'orders') {
        const orders = await prisma.order.findMany({
          where: { businessId: req.params.bizId, orderDate: { not: null } },
          orderBy: { orderDate: 'asc' },
        });
        const daily = {};
        orders.forEach(o => {
          const d = new Date(o.orderDate).toISOString().split('T')[0];
          daily[d] = (daily[d] || 0) + 1;
        });
        series = Object.entries(daily).map(([d, v]) => ({ d, v }));
      } else if (req.params.metric === 'customerGrowth') {
        const customers = await prisma.customer.findMany({
          where: { businessId: req.params.bizId },
          orderBy: { createdAt: 'asc' },
        });
        let total = 0;
        const daily = {};
        customers.forEach(c => {
          const d = new Date(c.createdAt).toISOString().split('T')[0];
          total += 1;
          daily[d] = total;
        });
        series = Object.entries(daily).map(([d, v]) => ({ d, v }));
      } else if (req.params.metric === 'conversion') {
        const traffic = await prisma.trafficPoint.findMany({
          where: { businessId: req.params.bizId, occurredAt: { not: null } },
          orderBy: { occurredAt: 'asc' },
        });
        const daily = {};
        traffic.forEach(t => {
          const d = new Date(t.occurredAt).toISOString().split('T')[0];
          const rate = t.visitors > 0 ? (t.conversions / t.visitors) * 100 : 0;
          daily[d] = Math.round(rate * 100) / 100;
        });
        series = Object.entries(daily).map(([d, v]) => ({ d, v }));
      }
    }
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

// @desc    Import metrics from Excel file — Fix #39: accumulate all rows, upsert scalars once
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
    const rows = await readExcelFile(req.file.path);

    if (!rows || rows.length < 2) {
      res.status(400);
      throw new Error('Excel file must have a header row and at least one data row');
    }

    const headers = rows[0].map(h => h?.toString().toLowerCase().trim());

    // ── Fix #39: Collect ALL row entries first, then do ONE business update ──
    // Previously, each loop iteration read from the same original `business` object
    // and did a prisma.business.update, so each update overwrote the previous one.
    // Only the last row's append survived in the series array.
    const newRevenueEntries = [];
    const newOrdersEntries  = [];
    const newCustomerEntries = [];
    const updates = [];

    // Scalar values from the last (most recent) row
    let lastRevenue = 0, lastRevenueGrowth = 0;
    let lastOrders  = 0;
    let lastCustomers = 0, lastCustomerGrowth = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Skip completely empty rows
      if (row.every(cell => cell === null || cell === undefined)) continue;

      const rowData = {};
      headers.forEach((header, idx) => { if (header) rowData[header] = row[idx]; });

      // Parse columns (accept common column name variants)
      const revenue       = parseFloat(rowData['revenue']        || rowData['rev']         || 0) || 0;
      const revenueGrowth = parseFloat(rowData['revenue growth'] || rowData['rev growth']  || 0) || 0;
      const orders        = parseInt(  rowData['orders']         || rowData['order count'] || 0) || 0;
      const customers     = parseInt(  rowData['customers']      || rowData['customer count'] || 0) || 0;
      const customerGrowth= parseFloat(rowData['customer growth']|| rowData['cust growth'] || 0) || 0;

      // Use the row's own date if provided, otherwise offset by row index
      // so multiple rows on the same import each get a distinct date point.
      // Fix: create a fresh Date inside the loop — reusing a single `today`
      // and calling .setDate() on it mutates the shared object, so every
      // iteration starts from the already-mutated date, producing wrong values.
      const rowDate = rowData['date']
        ? String(rowData['date']).slice(0, 10)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - (rows.length - 1 - i));
            return d.toISOString().split('T')[0];
          })();

      newRevenueEntries.push( { d: rowDate, v: revenue });
      newOrdersEntries.push(  { d: rowDate, v: orders });
      newCustomerEntries.push({ d: rowDate, v: customers });

      // Keep scalars from the last row (most recent data point)
      lastRevenue       = revenue;
      lastRevenueGrowth = revenueGrowth;
      lastOrders        = orders;
      lastCustomers     = customers;
      lastCustomerGrowth= customerGrowth;

      updates.push({ date: rowDate, revenue, revenueGrowth, orders, customers, customerGrowth, status: 'collected' });
    }

    if (updates.length === 0) {
      res.status(400);
      throw new Error('No valid data rows found in the Excel file');
    }

    // ── Single business update: merge existing series + all new entries ──
    const existingRevenue   = (() => { try { return JSON.parse(business.revenueSeries  || '[]'); } catch { return []; } })();
    const existingOrders    = (() => { try { return JSON.parse(business.ordersSeries   || '[]'); } catch { return []; } })();
    const existingCustomers = (() => { try { return JSON.parse(business.customerGrowth || '[]'); } catch { return []; } })();

    await prisma.business.update({
      where: { id: req.params.bizId },
      data: {
        revenueSeries:  JSON.stringify([...existingRevenue,   ...newRevenueEntries ].slice(-90)),
        ordersSeries:   JSON.stringify([...existingOrders,    ...newOrdersEntries  ].slice(-90)),
        customerGrowth: JSON.stringify([...existingCustomers, ...newCustomerEntries].slice(-90)),
      },
    });

    // ── Scalar metric upserts: use values from the LAST (most recent) row only ──
    await Promise.all([
      prisma.metric.upsert({
        where:  { businessId_key: { businessId: req.params.bizId, key: 'revenue' } },
        update: { value: lastRevenue, delta: lastRevenueGrowth, unit: '₹', period: 'vs last period' },
        create: { businessId: req.params.bizId, key: 'revenue', value: lastRevenue, delta: lastRevenueGrowth, unit: '₹', period: 'vs last period', label: 'Revenue' },
      }),
      prisma.metric.upsert({
        where:  { businessId_key: { businessId: req.params.bizId, key: 'orders' } },
        update: { value: lastOrders, delta: 0, unit: '', period: 'this week' },
        create: { businessId: req.params.bizId, key: 'orders', value: lastOrders, delta: 0, unit: '', period: 'this week', label: 'Orders' },
      }),
      prisma.metric.upsert({
        where:  { businessId_key: { businessId: req.params.bizId, key: 'customers' } },
        update: { value: lastCustomers, delta: lastCustomerGrowth, unit: '', period: 'total' },
        create: { businessId: req.params.bizId, key: 'customers', value: lastCustomers, delta: lastCustomerGrowth, unit: '', period: 'total', label: 'Customers' },
      }),
    ]);

    res.json({
      message: `Metrics imported successfully — ${updates.length} data point(s) added to series`,
      totalUpdated: updates.length,
      updates,
    });
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to import Excel: ${error.message}`);
  } finally {
    // Fix #40: always clean up the temp file to avoid disk accumulation
    if (req.file?.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => { if (err) console.warn('[importExcel] cleanup failed:', err.message); });
    }
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
