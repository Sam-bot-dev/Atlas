/**
 * mockData.js — Demo period scaling helpers
 *
 * Provides buildDemoData(business, period) so the Overview's period picker
 * visibly changes metrics and charts for demo businesses (which have no
 * real backend data).
 */

const PERIOD_DAYS = { '7D': 7, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095 };

/**
 * Scale demo business data to the selected period.
 * Returns { series, metrics } where series is the period-sliced revenueSeries
 * and metrics is scaled from the baseline values in the business object.
 *
 * @param {object} business  - demo business object from data.jsx
 * @param {string} period    - '1W' | '1M' | '3M' | '6M' | '1Y'
 * @returns {{ series: array, metrics: object }}
 */
export function buildDemoData(business, period) {
  const days = PERIOD_DAYS[period] || 30;
  const baseline = 30; // 1M baseline in days

  // Revenue scaling: longer periods see more total but show different averages
  const revFactor = Math.min(1.2, (days / baseline) * 0.75 + 0.25);
  // Orders scale similarly
  const ordFactor = Math.min(1.2, (days / baseline) * 0.8 + 0.2);
  // Delta compresses for very short windows (less volatility visible)
  const deltaFactor = days <= 7 ? 0.35 : days <= 30 ? 0.7 : 1.0;

  // --- Metrics ---
  const baseMetrics = business.metrics || {};
  const metrics = {};
  for (const [key, m] of Object.entries(baseMetrics)) {
    let value = m.value;
    let delta = m.delta;

    if (key === 'revenue') {
      value = Math.round(m.value * revFactor);
      delta = Math.round(m.delta * deltaFactor * 10) / 10;
    } else if (key === 'orders') {
      value = Math.round(m.value * ordFactor);
      delta = Math.round(m.delta * deltaFactor * 10) / 10;
    } else if (key === 'conversion') {
      value = Math.max(0.5, Math.min(12, m.value + (days <= 7 ? 0.3 : days >= 180 ? -0.4 : 0)));
      delta = Math.round(m.delta * deltaFactor * 0.6 * 10) / 10;
    } else if (key === 'inventory' || key === 'sentiment') {
      // Inventory and sentiment stay stable regardless of period
      value = m.value;
      delta = 0;
    } else if (key === 'retention') {
      value = m.value;
      delta = Math.round(m.delta * deltaFactor * 0.4 * 10) / 10;
    }

    const periodLabel = days <= 7 ? 'this week' : days <= 30 ? 'this month' : 'vs last period';
    metrics[key] = { ...m, value, delta, period: periodLabel };
  }

  // --- Series ---
  // Slice the stored monthly series to match the selected period window.
  // All demo series have 7 monthly data points (Nov–May).
  const full     = business.revenueSeries  || [];
  const custFull = business.customerGrowth || [];
  const ordFull  = business.ordersSeries   || [];

  // How many monthly buckets to show for each period
  let sliceCount;
  if (days <= 7)        sliceCount = 1;
  else if (days <= 30)  sliceCount = 2;
  else if (days <= 90)  sliceCount = 3;
  else if (days <= 180) sliceCount = 5;
  else                  sliceCount = full.length; // 1Y → all

  const series         = full.slice(-Math.max(1, sliceCount));
  const customerSeries = custFull.slice(-Math.max(1, sliceCount));

  // Orders series is weekly (Mon–Sun) — scale the values by the period factor
  const ordersSeries = ordFull.map(d => ({
    ...d,
    v: Math.round((d.v || 0) * ordFactor),
  }));

  return { series, customerSeries, ordersSeries, metrics };
}
