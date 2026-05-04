// Shared utility: generates period-appropriate mock series + scaled metrics
// from a base business object. Used by Overview and Analytics.
//
// Periods:
//   1W  → 7 daily points  (Mon–Sun)
//   1M  → 4 weekly points (W1–W4)
//   3M  → 13 weekly points
//   6M  → 6 monthly points
//   1Y  → 12 monthly points
//
// Analytics page uses '7D' as the key for 1 week — mapped to '1W' internally.

const DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Deterministic jitter so values are consistent across renders
const jitter = (seed, i, amp = 0.12) => 1 + amp * Math.sin(seed + i * 1.7);

export const buildDemoData = (biz, period) => {
  const baseRevMonth = biz.metrics?.revenue?.value || 100000;
  const seed = biz.id.charCodeAt(0);
  const now = new Date();
  const curMonth = now.getMonth();

  // Normalise Analytics '7D' → '1W'
  const p = period === '7D' ? '1W' : period;

  let series = [];
  let customerSeries = [];
  let periodLabel = 'this month';
  let revenueValue = baseRevMonth;
  let revenueDelta = biz.metrics?.revenue?.delta ?? 5;

  if (p === '1W') {
    const dailyBase = Math.round(baseRevMonth / 30);
    series = DAY_NAMES.map((d, i) => ({ d, v: Math.round(dailyBase * jitter(seed, i)) }));
    customerSeries = DAY_NAMES.map((d, i) => ({ d, v: Math.round((biz.metrics?.retention?.value || 50) * jitter(seed, i + 7, 0.08)) }));
    revenueValue = series.reduce((s, pt) => s + pt.v, 0);
    revenueDelta = parseFloat((revenueDelta * 0.8).toFixed(1));
    periodLabel = 'this week';

  } else if (p === '1M') {
    const weeklyBase = Math.round(baseRevMonth / 4);
    series = ['W1', 'W2', 'W3', 'W4'].map((d, i) => ({ d, v: Math.round(weeklyBase * jitter(seed, i)) }));
    customerSeries = ['W1', 'W2', 'W3', 'W4'].map((d, i) => ({ d, v: Math.round((biz.customerGrowth?.at(-1)?.v || 200) * jitter(seed, i + 4, 0.06)) }));
    revenueValue = baseRevMonth;
    periodLabel = 'this month';

  } else if (p === '3M') {
    series = Array.from({ length: 13 }, (_, i) => ({
      d: `W${13 - i}`,
      v: Math.round((baseRevMonth / 4) * jitter(seed, i) * (0.88 + i * 0.01)),
    }));
    customerSeries = Array.from({ length: 13 }, (_, i) => ({
      d: `W${13 - i}`,
      v: Math.round((biz.customerGrowth?.at(-1)?.v || 200) * (0.82 + i * 0.015) * jitter(seed, i + 13, 0.05)),
    }));
    revenueValue = series.reduce((s, pt) => s + pt.v, 0);
    revenueDelta = parseFloat((revenueDelta * 1.4).toFixed(1));
    periodLabel = 'last 3 months';

  } else if (p === '6M') {
    series = Array.from({ length: 6 }, (_, i) => {
      const mIdx = (curMonth - 5 + i + 12) % 12;
      return { m: MONTH_NAMES[mIdx], v: Math.round(baseRevMonth * jitter(seed, i) * (0.85 + i * 0.03)) };
    });
    customerSeries = Array.from({ length: 6 }, (_, i) => {
      const mIdx = (curMonth - 5 + i + 12) % 12;
      const base = biz.customerGrowth?.at(-1)?.v || 200;
      return { m: MONTH_NAMES[mIdx], v: Math.round(base * (0.78 + i * 0.04) * jitter(seed, i + 6, 0.05)) };
    });
    revenueValue = series.reduce((s, pt) => s + pt.v, 0);
    revenueDelta = parseFloat((revenueDelta * 2.8).toFixed(1));
    periodLabel = 'last 6 months';

  } else {
    // 1Y — 12 monthly points
    series = Array.from({ length: 12 }, (_, i) => {
      const mIdx = (curMonth - 11 + i + 12) % 12;
      return { m: MONTH_NAMES[mIdx], v: Math.round(baseRevMonth * jitter(seed, i) * (0.75 + i * 0.022)) };
    });
    customerSeries = Array.from({ length: 12 }, (_, i) => {
      const mIdx = (curMonth - 11 + i + 12) % 12;
      const base = biz.customerGrowth?.at(-1)?.v || 200;
      return { m: MONTH_NAMES[mIdx], v: Math.round(base * (0.65 + i * 0.032) * jitter(seed, i + 12, 0.05)) };
    });
    revenueValue = series.reduce((s, pt) => s + pt.v, 0);
    revenueDelta = parseFloat((revenueDelta * 5.5).toFixed(1));
    periodLabel = 'last 12 months';
  }

  // Scale non-revenue metrics proportionally to the period revenue
  const scale = revenueValue / baseRevMonth;
  const scaledMetrics = {};
  Object.entries(biz.metrics || {}).forEach(([k, m]) => {
    if (k === 'revenue') {
      scaledMetrics[k] = { ...m, value: revenueValue, delta: revenueDelta, period: periodLabel };
    } else if (m.unit === '%' || m.unit === '/5') {
      scaledMetrics[k] = { ...m, period: periodLabel };
    } else {
      scaledMetrics[k] = { ...m, value: Math.round((m.value || 0) * scale), period: periodLabel };
    }
  });

  return { series, customerSeries, metrics: scaledMetrics, periodLabel };
};
