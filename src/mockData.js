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

  for (const [key, m] of Object.entries(baseMetrics)) {
    let value = m.value ?? 0;
    let delta = m.delta ?? 0;

    if (key === 'revenue') {
      value = Math.round(baseRevenue * revFactor);
      delta = r2(delta * deltaFactor);
    } else if (key === 'orders') {
      // Scale orders proportionally to revenue
      value = Math.round(value * Math.min(revFactor, 1.5));
      delta = r2(delta * deltaFactor);
    } else if (key === 'conversion') {
      const adj = days <= 7 ? 0.3 : days >= 180 ? -0.4 : 0;
      value = r2(Math.max(0.5, Math.min(12, value + adj)));
      delta = r2(delta * deltaFactor * 0.6);
    } else if (key === 'inventory' || key === 'sentiment') {
      value = r2(value);
      delta = 0;
    } else if (key === 'retention') {
      value = r2(value);
      delta = r2(delta * deltaFactor * 0.4);
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
