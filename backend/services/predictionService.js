/**
 * Prediction Service
 * 
 * Mini ML models for:
 * - Time-series forecasting (Prophet or regression)
 * - Anomaly detection
 * - Customer churn prediction
 * 
 * Note: For production, consider using Python + FastAPI + Scikit-learn
 * This version uses simplified algorithms implementable in Node.js
 */

const { prisma } = require('../lib/prisma');

/**
 * Forecast revenue for next 30 days
 * Uses simple linear regression on 7-month historical data
 */
async function forecastRevenue(businessId, daysAhead = 30) {
  try {
    const orders = await prisma.order.findMany({
      where: { businessId },
      orderBy: { orderDate: 'asc' },
    });

    if (orders.length < 10) {
      return {
        available: false,
        reason: 'Insufficient historical data (need at least 10 orders)',
      };
    }

    // Aggregate revenue by day
    const dailyRevenue = aggregateByDay(orders, 'total');

    // Get last 7 days for trend
    const recentDays = dailyRevenue.slice(-7);
    const olderDays = dailyRevenue.slice(0, Math.max(1, dailyRevenue.length - 7));

    const recentTrend = calculateTrend(recentDays);
    const overallTrend = calculateTrend(dailyRevenue);

    // Simple forecast: weighted average of recent trend + overall trend
    const avgRecent = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
    const avgOverall = dailyRevenue.reduce((a, b) => a + b, 0) / dailyRevenue.length;

    const forecast = [];
    const currentDate = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      // Blend recent and overall trends
      const predictedValue = avgRecent * 0.6 + avgOverall * 0.4 + recentTrend * i * 0.1;
      const confidence = calculateConfidence(orders.length);

      forecast.push({
        date,
        predicted: Math.max(0, predictedValue),
        confidence,
      });
    }

    return {
      available: true,
      modelType: 'linear_regression',
      trainingDataPoints: orders.length,
      forecast,
      trendDirection: recentTrend > 0 ? 'up' : 'down',
    };
  } catch (error) {
    console.error(`Error forecasting revenue for business ${businessId}:`, error);
    return { available: false, error: error.message };
  }
}

/**
 * Forecast order volume
 */
async function forecastOrders(businessId, daysAhead = 30) {
  try {
    const orders = await prisma.order.findMany({
      where: { businessId },
      orderBy: { orderDate: 'asc' },
    });

    if (orders.length < 10) {
      return {
        available: false,
        reason: 'Insufficient historical data',
      };
    }

    const dailyOrders = aggregateByDay(orders, 'count');
    const trend = calculateTrend(dailyOrders);
    const avgDaily = dailyOrders.reduce((a, b) => a + b, 0) / dailyOrders.length;

    const forecast = [];
    const currentDate = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      const predicted = Math.max(0, avgDaily + trend * i);

      forecast.push({
        date,
        predicted: Math.round(predicted),
        confidence: calculateConfidence(orders.length),
      });
    }

    return {
      available: true,
      modelType: 'linear_regression',
      forecast,
      trendDirection: trend > 0 ? 'up' : 'down',
    };
  } catch (error) {
    console.error(`Error forecasting orders for business ${businessId}:`, error);
    return { available: false, error: error.message };
  }
}

/**
 * Detect anomalies in recent data
 * Uses statistical outlier detection (Z-score)
 */
async function detectAnomalies(businessId) {
  try {
    const [orders, reviews] = await Promise.all([
      prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.review.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const anomalies = [];

    // Check revenue anomalies
    const dailyRevenue = aggregateByDay(orders, 'total');
    const revenueAnomalies = detectOutliers(dailyRevenue);

    if (revenueAnomalies.length > 0) {
      anomalies.push({
        type: 'revenue_anomaly',
        severity: revenueAnomalies[0].zscore > 3 ? 'high' : 'medium',
        message: `Unusual revenue pattern detected: ${revenueAnomalies[0].deviation > 0 ? 'spike' : 'drop'} of ${Math.round(Math.abs(revenueAnomalies[0].deviation))}%`,
        data: revenueAnomalies[0],
      });
    }

    // Check review sentiment anomalies
    const ratings = reviews.map((r) => r.rating);
    if (ratings.length > 5) {
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const recentAvg = ratings.slice(0, 5).reduce((a, b) => a + b, 0) / 5;

      if (Math.abs(recentAvg - avgRating) > 1) {
        anomalies.push({
          type: 'sentiment_anomaly',
          severity: recentAvg < avgRating - 1 ? 'high' : 'medium',
          message: `Significant drop in customer satisfaction: ${recentAvg.toFixed(1)}/5 vs ${avgRating.toFixed(1)}/5 average`,
          data: { recentAvg, historicalAvg: avgRating },
        });
      }
    }

    // Check order frequency anomalies
    const dailyOrders = aggregateByDay(orders, 'count');
    const orderAnomalies = detectOutliers(dailyOrders);

    if (orderAnomalies.length > 0 && orderAnomalies[0].zscore > 2) {
      anomalies.push({
        type: 'order_anomaly',
        severity: 'medium',
        message: `Unusual order volume: ${Math.round(Math.abs(orderAnomalies[0].deviation))}% deviation from average`,
        data: orderAnomalies[0],
      });
    }

    return {
      detected: anomalies.length > 0,
      anomalies,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(
      `Error detecting anomalies for business ${businessId}:`,
      error,
    );
    return { detected: false, error: error.message };
  }
}

/**
 * Predict customer churn risk
 */
async function predictChurnRisk(businessId) {
  try {
    const customers = await prisma.customer.findMany({
      where: { businessId },
    });

    const churnRisks = customers.map((customer) => {
      let score = 0;

      // Factor 1: Low order frequency
      if (customer.ordersCount <= 1) score += 40;
      else if (customer.ordersCount <= 2) score += 20;

      // Factor 2: Low total spend
      if (customer.totalSpend < 1000) score += 10;

      // Factor 3: Segment
      if (customer.segment === 'at_risk') score += 30;

      // Cap at 100
      score = Math.min(100, score);

      const risk =
        score > 70
          ? 'high'
          : score > 40
            ? 'medium'
            : 'low';

      return {
        customerId: customer.id,
        name: customer.name,
        churnRiskScore: score,
        riskLevel: risk,
        ordersCount: customer.ordersCount,
        totalSpend: customer.totalSpend,
      };
    });

    const highRisk = churnRisks.filter((c) => c.riskLevel === 'high');
    const mediumRisk = churnRisks.filter((c) => c.riskLevel === 'medium');

    return {
      available: customers.length > 0,
      totalCustomers: customers.length,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      recommendations: generateChurnRecommendations(highRisk, mediumRisk),
      details: churnRisks,
    };
  } catch (error) {
    console.error(`Error predicting churn for business ${businessId}:`, error);
    return { available: false, error: error.message };
  }
}

/**
 * Helper: Aggregate data by day
 */
function aggregateByDay(orders, metric = 'total') {
  const daily = {};

  orders.forEach((order) => {
    const date = new Date(order.orderDate || order.createdAt).toDateString();
    if (!daily[date]) daily[date] = 0;

    if (metric === 'total') {
      daily[date] += order.total || 0;
    } else if (metric === 'count') {
      daily[date] += 1;
    }
  });

  return Object.values(daily);
}

/**
 * Helper: Calculate trend from series
 */
function calculateTrend(series) {
  if (series.length < 2) return 0;

  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += series[i];
    sumXY += i * series[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Helper: Detect outliers using Z-score
 */
function detectOutliers(series, threshold = 2) {
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance =
    series.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / series.length;
  const stdDev = Math.sqrt(variance);

  return series
    .map((value, index) => ({
      index,
      value,
      zscore: Math.abs((value - mean) / (stdDev || 1)),
      deviation: ((value - mean) / (mean || 1)) * 100,
    }))
    .filter((x) => x.zscore > threshold)
    .sort((a, b) => b.zscore - a.zscore)
    .slice(0, 3);
}

/**
 * Helper: Calculate confidence based on data volume
 */
function calculateConfidence(dataPoints) {
  if (dataPoints < 10) return 'low';
  if (dataPoints < 50) return 'medium';
  return 'high';
}

/**
 * Helper: Generate churn prevention recommendations
 */
function generateChurnRecommendations(highRisk, mediumRisk) {
  const recommendations = [];

  if (highRisk.length > 0) {
    recommendations.push({
      action: 'send_winback_offer',
      targetCount: highRisk.length,
      message: `Send personalized discount offers to ${highRisk.length} high-risk customers.`,
      urgency: 'high',
    });
  }

  if (mediumRisk.length > 0) {
    recommendations.push({
      action: 'send_engagement_email',
      targetCount: mediumRisk.length,
      message: `Send engagement emails or new product announcements to ${mediumRisk.length} medium-risk customers.`,
      urgency: 'medium',
    });
  }

  return recommendations;
}

module.exports = {
  forecastRevenue,
  forecastOrders,
  detectAnomalies,
  predictChurnRisk,
};
