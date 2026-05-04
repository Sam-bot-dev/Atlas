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

  // Safe rounding helper — avoids IEEE 754 float garbage like 3.8000000000000003
  const r2 = (n) => Math.round(n * 100) / 100;

  // --- Metrics ---
  const baseMetrics = business.metrics || {};
  const metrics = {};
  for (const [key, m] of Object.entries(baseMetrics)) {
    let value = m.value ?? 0;
    let delta = m.delta ?? 0;

    if (key === 'revenue') {
      value = Math.round(value * revFactor);
      delta = r2(delta * deltaFactor);
    } else if (key === 'orders') {
      value = Math.round(value * ordFactor);
      delta = r2(delta * deltaFactor);
    } else if (key === 'conversion') {
      // Clamp and round to 2dp to prevent float precision bleed
      const adj = days <= 7 ? 0.3 : days >= 180 ? -0.4 : 0;
      value = r2(Math.max(0.5, Math.min(12, value + adj)));
      delta = r2(delta * deltaFactor * 0.6);
    } else if (key === 'inventory' || key === 'sentiment') {
      // Stable regardless of period — no scaling
      value = r2(value);
      delta = 0;
    } else if (key === 'retention') {
      value = r2(value);
      delta = r2(delta * deltaFactor * 0.4);
    } else {
      // Any other metric: round delta only
      delta = r2(delta * deltaFactor);
    }

    const periodLabel = days <= 7 ? 'this week' : days <= 30 ? 'this month' : 'vs last period';
    metrics[key] = { ...m, value, delta, period: periodLabel };
  }

  // --- Series ---
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
