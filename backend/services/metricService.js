/**
 * Metric Aggregation Service
 * 
 * Calculates real-time KPIs from normalized data:
 * - Revenue Trend
 * - Order Volume
 * - Conversion Rate
 * - Inventory Health
 * - Customer Retention
 * - Review Sentiment
 * - Peak Hours
 */

const { prisma } = require('../lib/prisma');

/**
 * Calculate metrics for a business
 * @param {string} businessId
 * @returns {Promise<Object>} aggregated metrics
 */
async function calculateMetrics(businessId) {
  try {
    const [revenue, orders, conversion, inventory, retention, sentiment] =
      await Promise.all([
        calculateRevenueTrend(businessId),
        calculateOrderVolume(businessId),
        calculateConversionRate(businessId),
        calculateInventoryHealth(businessId),
        calculateRetention(businessId),
        calculateSentiment(businessId),
      ]);

    return {
      revenue,
      orders,
      conversion,
      inventory,
      retention,
      sentiment,
      calculatedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error calculating metrics for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Revenue Trend: Total revenue this period vs last period
 */
async function calculateRevenueTrend(businessId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [currentPeriod, previousPeriod] = await Promise.all([
    prisma.order.aggregate({
      where: {
        businessId,
        orderDate: { gte: thirtyDaysAgo },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        businessId,
        orderDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { total: true },
    }),
  ]);

  const current = currentPeriod._sum.total || 0;
  const previous = previousPeriod._sum.total || 0;
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    value: Math.round(current),
    delta: Math.round(delta * 100) / 100,
    label: `₹${formatINR(current)}`,
    unit: '₹',
    period: 'vs last 30 days',
  };
}

/**
 * Order Volume: Number of orders this period
 */
async function calculateOrderVolume(businessId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [currentPeriod, previousPeriod] = await Promise.all([
    prisma.order.count({
      where: {
        businessId,
        orderDate: { gte: sevenDaysAgo },
      },
    }),
    prisma.order.count({
      where: {
        businessId,
        orderDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ]);

  const delta =
    previousPeriod > 0
      ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
      : 0;

  return {
    value: currentPeriod,
    delta: Math.round(delta * 100) / 100,
    label: `${currentPeriod} orders`,
    unit: '',
    period: 'vs last 7 days',
  };
}

/**
 * Conversion Rate: orders / visitors
 */
async function calculateConversionRate(businessId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalOrders, totalVisitors] = await Promise.all([
    prisma.order.count({
      where: {
        businessId,
        orderDate: { gte: thirtyDaysAgo },
      },
    }),
    prisma.trafficPoint.aggregate({
      where: {
        businessId,
        occurredAt: { gte: thirtyDaysAgo },
      },
      _sum: { visitors: true },
    }),
  ]);

  const visitors = totalVisitors._sum.visitors || 1;
  const conversionRate = (totalOrders / visitors) * 100;

  return {
    value: Math.round(conversionRate * 100) / 100,
    delta: 0,
    label: `${conversionRate.toFixed(2)}%`,
    unit: '%',
    period: 'last 30 days',
  };
}

/**
 * Inventory Health: % of items in stock vs low stock
 */
async function calculateInventoryHealth(businessId) {
  const [inStock, lowStock] = await Promise.all([
    prisma.inventoryItem.count({
      where: {
        businessId,
        quantityOnHand: { gt: 0 },
      },
    }),
    prisma.inventoryItem.count({
      where: {
        businessId,
        quantityOnHand: { lte: 0 },
      },
    }),
  ]);

  const total = inStock + lowStock || 1;
  const health = (inStock / total) * 100;

  return {
    value: Math.round(health),
    delta: 0,
    label: `${Math.round(health)}% in stock`,
    unit: '%',
    period: 'current',
  };
}

/**
 * Customer Retention: repeat customers / total customers
 */
async function calculateRetention(businessId) {
  const allCustomers = await prisma.customer.findMany({
    where: { businessId },
  });

  const repeatCustomers = allCustomers.filter((c) => c.ordersCount > 1).length;
  const totalCustomers = allCustomers.length || 1;
  const retention = (repeatCustomers / totalCustomers) * 100;

  return {
    value: Math.round(retention),
    delta: 0,
    label: `${Math.round(retention)}% repeat`,
    unit: '%',
    period: 'all time',
  };
}

/**
 * Review Sentiment: Average rating from reviews
 */
async function calculateSentiment(businessId) {
  const result = await prisma.review.aggregate({
    where: { businessId },
    _avg: { rating: true },
  });

  const avgRating = result._avg.rating || 0;

  return {
    value: Math.round(avgRating * 10) / 10,
    delta: 0,
    label: `${avgRating.toFixed(1)}/5`,
    unit: '/5',
    period: 'from reviews',
  };
}

/**
 * Peak Hours Analysis: visitor patterns by day/hour
 * Returns a 7x12 matrix (7 days × 12 hours: 8am–7pm)
 */
async function calculatePeakHours(businessId) {
  const trafficPoints = await prisma.trafficPoint.findMany({
    where: { businessId },
  });

  // Initialize 7x12 matrix
  const matrix = Array.from({ length: 7 }, () => Array(12).fill(0));

  trafficPoints.forEach((point) => {
    if (!point.occurredAt) return;
    const date = new Date(point.occurredAt);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    // Map hour to 0–11 (8am–7pm)
    const hourIndex = hour - 8;
    if (hourIndex >= 0 && hourIndex < 12) {
      matrix[dayOfWeek][hourIndex] += point.visitors || 0;
    }
  });

  // Normalize to 0–100 scale
  const flat = matrix.flat();
  const max = Math.max(...flat, 1);
  return matrix.map((day) =>
    day.map((v) => Math.round((v / max) * 100)),
  );
}

/**
 * Save calculated metrics to the database
 */
async function saveMetrics(businessId, metrics) {
  const { revenue, orders, conversion, inventory, retention, sentiment } =
    metrics;

  const metricsList = [
    { key: 'revenue', ...revenue },
    { key: 'orders', ...orders },
    { key: 'conversion', ...conversion },
    { key: 'inventory', ...inventory },
    { key: 'retention', ...retention },
    { key: 'sentiment', ...sentiment },
  ];

  for (const metric of metricsList) {
    await prisma.metric.upsert({
      where: { businessId_key: { businessId, key: metric.key } },
      create: {
        businessId,
        key: metric.key,
        value: metric.value,
        delta: metric.delta,
        unit: metric.unit,
        period: metric.period,
        label: metric.label,
      },
      update: {
        value: metric.value,
        delta: metric.delta,
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Format number to Indian notation (₹)
 */
function formatINR(value) {
  const abs = Math.abs(value);
  if (abs >= 10000000) return (value / 10000000).toFixed(2) + 'Cr';
  if (abs >= 100000) return (value / 100000).toFixed(2) + 'L';
  if (abs >= 1000) return (value / 1000).toFixed(1) + 'k';
  return value.toFixed(0);
}

module.exports = {
  calculateMetrics,
  calculateRevenueTrend,
  calculateOrderVolume,
  calculateConversionRate,
  calculateInventoryHealth,
  calculateRetention,
  calculateSentiment,
  calculatePeakHours,
  saveMetrics,
};
