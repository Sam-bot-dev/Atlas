/**
 * mockData.js — Demo period scaling helpers
 *
 * Provides buildDemoData(business, period) so the Overview's period picker
 * visibly changes metrics and charts for demo businesses.
 *
 * Data strategy:
 *  - 7D  → use revenueDailySeries (last 7 days, keyed by 'd')
 *  - 1M  → use revenueDailySeries (last 30 days, keyed by 'd')
 *  - 3M  → use revenueSeries monthly, last 3 months
 *  - 6M  → use revenueSeries monthly, last 6 months
 *  - 1Y  → use revenueSeries monthly, all 12 months
 */

const PERIOD_DAYS = { '7D': 7, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

// Safe round to 2dp
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Scale demo business data to the selected period.
 * @param {object} business  - demo business object from data.jsx
 * @param {string} period    - '7D' | '1M' | '3M' | '6M' | '1Y'
 * @returns {{ series, customerSeries, ordersSeries, metrics }}
 */
export function buildDemoData(business, period) {
  const days = PERIOD_DAYS[period] || 30;

  // --- Series selection ---
  // For short periods (7D, 1M) use daily granularity; for longer use monthly
  const useDaily = days <= 30;
  const dailySeries = business.revenueDailySeries || [];
  const monthlySeries = business.revenueSeries || [];
  const custMonthly = business.customerGrowth || [];
  const custDaily = business.customerDailySeries || [];

  let series, customerSeries;

  if (useDaily) {
    // Slice last N days from the daily series
    series = dailySeries.slice(-days);
    // Fix #B8: If no daily series exists, generate synthetic daily data from monthly series
    if (series.length === 0 && monthlySeries.length > 0) {
      const monthlyTotal = monthlySeries[monthlySeries.length - 1]?.v || 1000;
      const dailyAvg = monthlyTotal / days;
      // Generate realistic daily variation (weekdays 0.8-1.0x, weekends 1.1-1.5x)
      const dayOfWeek = new Date().getDay();
      series = Array.from({ length: days }, (_, i) => {
        const dow = (dayOfWeek + i) % 7; // day of week
        const isWeekend = dow === 0 || dow === 6;
        const variance = isWeekend ? 1.2 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2;
        const value = Math.max(100, Math.round(dailyAvg * variance));
        const date = new Date();
        date.setDate(date.getDate() - days + i + 1);
        const d = date.getDate() + ' ' + date.toLocaleString('en-IN', { month: 'short' });
        return { d, v: value };
      });
    }
    customerSeries = custDaily.length > 0 ? custDaily.slice(-days) : [];
  } else {
    // Monthly slices: 3M=3, 6M=6, 1Y=12
    const monthCount = days <= 90 ? 3 : days <= 180 ? 6 : 12;
    series = monthlySeries.slice(-monthCount);
    customerSeries = custMonthly.slice(-monthCount);
  }

  // Orders series is always weekly (Mon–Sun), no slicing needed
  const ordFull = business.ordersSeries || [];

  // --- Metric scaling ---
  // Base metrics are calibrated to 1M. Scale relative to that.
  const baseMetrics = business.metrics || {};
  const metrics = {};

  // Compute period revenue from the series we just selected
  const periodRevenue = series.reduce((s, d) => s + (d.v || 0), 0);
  // 1M baseline revenue (sum of daily series last 30 days)
  const baseRevenue = dailySeries.slice(-30).reduce((s, d) => s + (d.v || 0), 0) || 1;
  const revFactor = periodRevenue / baseRevenue;

  // Delta compression: short windows show less volatility
  const deltaFactor = days <= 7 ? 0.3 : days <= 30 ? 0.7 : days <= 90 ? 0.9 : 1.0;

  // Seeded pseudo-random for consistent but varying values per period
  const seed = (business.id || 'biz').split('').reduce((s, c) => s + c.charCodeAt(0), 0) + days;
  const pseudoRandom = (offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  for (const [key, m] of Object.entries(baseMetrics)) {
    let value = m.value ?? 0;
    let delta = m.delta ?? 0;

    if (key === 'revenue') {
      value = Math.round(baseRevenue * revFactor);
      delta = r2(delta * deltaFactor);
    } else if (key === 'orders') {
      // Scale orders proportionally to revenue with some natural variance
      const orderVariance = 0.95 + pseudoRandom(1) * 0.1;
      value = Math.round(value * Math.min(revFactor, 1.5) * orderVariance);
      delta = r2(delta * deltaFactor);
    } else if (key === 'conversion') {
      const adj = days <= 7 ? 0.3 : days >= 180 ? -0.4 : 0;
      const convVariance = 0.98 + pseudoRandom(2) * 0.04;
      value = r2(Math.max(0.5, Math.min(12, (value + adj) * convVariance)));
      delta = r2(delta * deltaFactor * 0.6);
    } else if (key === 'inventory') {
      // Inventory health varies with period length - longer periods = more stable view
      const invVariance = 0.97 + pseudoRandom(3) * 0.06;
      const periodAdj = days <= 30 ? 2 : days <= 90 ? -1 : days <= 180 ? -2 : -3;
      value = r2(Math.max(50, Math.min(100, (value + periodAdj) * invVariance)));
      delta = r2(delta * deltaFactor * 0.5);
    } else if (key === 'sentiment') {
      // Review sentiment drifts slightly with period
      const sentVariance = 0.99 + pseudoRandom(4) * 0.02;
      const periodAdj = days <= 30 ? 0.1 : days <= 90 ? -0.05 : days <= 180 ? -0.1 : -0.15;
      value = r2(Math.max(3.0, Math.min(5.0, (value + periodAdj) * sentVariance)));
      delta = r2(delta * deltaFactor * 0.4);
    } else if (key === 'retention') {
      // Repeat customers / retention drifts with period
      const retVariance = 0.98 + pseudoRandom(5) * 0.04;
      const periodAdj = days <= 30 ? 1 : days <= 90 ? -0.5 : days <= 180 ? -1.5 : -2.5;
      value = r2(Math.max(20, Math.min(95, (value + periodAdj) * retVariance)));
      delta = r2(delta * deltaFactor * 0.6);
    } else {
      delta = r2(delta * deltaFactor);
    }

    const periodLabel =
      days <= 7 ? 'this week' :
      days <= 30 ? 'this month' :
      days <= 90 ? 'last 3 months' :
      days <= 180 ? 'last 6 months' : 'this year';

    metrics[key] = { ...m, value, delta, period: periodLabel };
  }

  return { series, customerSeries, ordersSeries: ordFull, metrics };
}
