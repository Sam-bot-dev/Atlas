const { prisma } = require('../lib/prisma');

/**
 * Perform simple linear regression
 * y = mx + b
 */
function linearRegression(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXX - sumX * sumX) === 0 ? 0 : (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Forecast Revenue based on historical order distributions
 */
async function forecastRevenue(businessId, daysAhead = 7) {
  const orders = await prisma.order.findMany({
    where: { businessId, orderDate: { not: null } },
    orderBy: { orderDate: 'asc' },
  });

  if (orders.length < 5) return { trend: 'stable', predictions: [] };

  const dailySales = {};
  orders.forEach(o => {
    const dateStr = new Date(o.orderDate).toISOString().split('T')[0];
    dailySales[dateStr] = (dailySales[dateStr] || 0) + o.total;
  });

  const sortedDates = Object.keys(dailySales).sort();
  const yVals = sortedDates.map(d => dailySales[d]);
  const xVals = Array.from({ length: yVals.length }, (_, i) => i);

  const { slope, intercept } = linearRegression(xVals, yVals);

  // Simple trend classification
  const trend = slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable';
  
  const predictions = [];
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  
  for (let i = 1; i <= daysAhead; i++) {
    const nextX = xVals.length - 1 + i;
    const predY = Math.max(0, slope * nextX + intercept); // Ensure no negative predicted revenue
    
    const predDate = new Date(lastDate);
    predDate.setDate(predDate.getDate() + i);
    predictions.push({ date: predDate.toISOString().split('T')[0], expectedRevenue: Math.round(predY) });
  }

  return { trend, slope: Math.round(slope), lastActual: yVals[yVals.length - 1], predictions };
}

/**
 * Detect Anomalies in recent data using Z-Score analysis
 */
async function detectAnomalies(businessId) {
  const anomalies = [];

  const orders = await prisma.order.findMany({
    where: { businessId, orderDate: { not: null } },
    orderBy: { orderDate: 'asc' },
  });

  if (orders.length < 10) return anomalies;

  const dailySales = {};
  orders.forEach(o => {
    const dateStr = new Date(o.orderDate).toISOString().split('T')[0];
    dailySales[dateStr] = (dailySales[dateStr] || 0) + o.total;
  });

  const values = Object.values(dailySales);
  const recentValue = values[values.length - 1]; // Examine the most recent period against historical norm
  
  const historical = values.slice(0, -1);
  if (historical.length < 5) return anomalies;

  const mean = historical.reduce((a, b) => a + b, 0) / historical.length;
  const variance = historical.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historical.length;
  const stdDev = Math.sqrt(variance) || 1; 

  const zScore = (recentValue - mean) / stdDev;

  if (Math.abs(zScore) > 2.5) { // 2.5 Sigma threshold for strict anomaly detection
    if (zScore > 0) {
      anomalies.push({
        type: 'revenue_spike',
        severity: 'positive',
        title: 'Anomalous Revenue Spike Detected',
        body: `Recent daily revenue (${recentValue}) is ${zScore.toFixed(1)} standard deviations above the historical average. Identify what drove this spike to replicate it.`,
      });
    } else {
      anomalies.push({
        type: 'revenue_drop',
        severity: 'negative',
        title: 'Sudden Revenue Drop Alert',
        body: `Recent daily revenue (${recentValue}) is significantly below the historical average. Immediate investigation is recommended.`,
      });
    }
  }

  // Hook into Insight generation explicitly
  for (const anomaly of anomalies) {
    await prisma.insight.create({
      data: {
        businessId,
        title: anomaly.title,
        body: anomaly.body,
        severity: anomaly.severity,
        evidence: JSON.stringify(['Anomaly Detection Model', 'Z-Score Analysis', 'Urgent Alert']),
      }
    });

    // Also trigger Automation evaluation logic specifically for anomalies!
    const { evaluateAutomations } = require('./automationService');
    await evaluateAutomations(businessId, anomaly.type, anomaly);
  }

  return anomalies;
}

module.exports = {
  linearRegression,
  forecastRevenue,
  detectAnomalies,
};
