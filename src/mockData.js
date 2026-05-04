/**
 * mockData.js — Demo period scaling helpers
 *
 * Provides buildDemoData(business, period) so the Overview's period picker
 * visibly changes metrics and charts for demo businesses (which have no
 * real backend data).
 */

const PERIOD_DAYS = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

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
  const full = business.revenueSeries || [];
  let sliceCount;
  if (days <= 7)       sliceCount = Math.min(2, full.length);
  else if (days <= 30) sliceCount = Math.min(3, full.length);
  else if (days <= 90) sliceCount = Math.min(4, full.length);
  else if (days <= 180)sliceCount = Math.min(5, full.length);
  else                 sliceCount = full.length;

  const series = full.slice(-Math.max(1, sliceCount));

  return { series, metrics };
}
