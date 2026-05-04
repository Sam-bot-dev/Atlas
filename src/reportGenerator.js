/**
 * reportGenerator.js — Client-side Atlas Business Brief generator
 *
 * Builds a styled HTML document from the current business snapshot and opens
 * it in a new tab. The user can then Ctrl+P / Cmd+P to print/save as PDF.
 *
 * Works for both demo businesses (no backend required) and real ones.
 */

const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '₹0';
  const num = Number(v);
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  if (num >= 100000)   return '₹' + (num / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

/**
 * Generate and open a printable HTML brief for a business snapshot.
 *
 * @param {object} snapshot - { name, category, location, metrics, insights, actions, revenueSeries }
 * @param {string} period   - e.g. '1M', '3M' — displayed in the header
 */
export function downloadReport(snapshot, period = '1M') {
  const { name, category, location, metrics = {}, insights = [], actions = [], revenueSeries = [] } = snapshot;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Metrics section ────────────────────────────────────────────────────────
  const metricRows = Object.entries(metrics).map(([key, m]) => {
    const val = m.unit === '₹' ? fmtINR(m.value) : `${m.value}${m.unit || ''}`;
    const delta = m.delta > 0 ? `+${m.delta}%` : `${m.delta}%`;
    const deltaColor = m.delta > 0 ? '#15803d' : m.delta < 0 ? '#dc2626' : '#6b7280';
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:500;color:#1c1917">${m.label || key}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:15px;font-weight:600">${val}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:${deltaColor};font-weight:600;font-family:monospace">${delta}</td>
      </tr>`;
  }).join('');

  // ── Revenue series (ASCII sparkline) ─────────────────────────────────────
  let sparkHtml = '';
  if (revenueSeries.length > 0) {
    const max = Math.max(...revenueSeries.map(d => d.v || 0), 1);
    sparkHtml = `
      <div style="display:flex;align-items:flex-end;gap:6px;height:48px;margin:16px 0">
        ${revenueSeries.map(d => {
          const h = Math.max(4, Math.round(((d.v || 0) / max) * 48));
          return `<div style="flex:1;background:#1c1917;height:${h}px;border-radius:3px 3px 0 0;min-width:8px" title="${d.m || d.d}: ${fmtINR(d.v)}"></div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:6px">
        ${revenueSeries.map(d => `<div style="flex:1;font-size:9px;color:#78716c;text-align:center;overflow:hidden;min-width:8px">${d.m || d.d || ''}</div>`).join('')}
      </div>`;
  }

  // ── Insights section ───────────────────────────────────────────────────────
  const severityColors = { positive: '#15803d', warning: '#b45309', negative: '#dc2626', info: '#1e40af' };
  const insightItems = insights.slice(0, 5).map(ins => `
    <div style="margin-bottom:16px;padding:16px;background:#fafafa;border-radius:8px;border-left:3px solid ${severityColors[ins.severity] || '#6b7280'}">
      <div style="font-size:11px;font-weight:600;color:${severityColors[ins.severity] || '#6b7280'};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">
        ${ins.severity === 'positive' ? 'Opportunity' : ins.severity === 'warning' ? 'Watch' : ins.severity === 'negative' ? 'Risk' : 'Pattern'}
      </div>
      <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:#1c1917">${ins.title}</div>
      <div style="font-size:13px;color:#44403c;line-height:1.55">${ins.body}</div>
    </div>`).join('') || '<p style="color:#78716c;font-size:13px">No insights available.</p>';

  // ── Actions section ────────────────────────────────────────────────────────
  const actionItems = actions.slice(0, 5).map((a, i) => `
    <div style="margin-bottom:12px;padding:16px;background:#fafafa;border-radius:8px${a.urgent ? ';border:1px solid #1c1917' : ''}">
      ${a.urgent ? '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#1c1917">Time-sensitive · </span>' : ''}
      <span style="font-size:14px;font-weight:600;color:#1c1917">${i + 1}. ${a.title}</span>
      <p style="font-size:13px;color:#44403c;margin:6px 0 10px;line-height:1.5">${a.body}</p>
      <div style="display:flex;gap:16px;font-size:11px">
        <span><b>Impact:</b> ${a.impact}</span>
        <span><b>Effort:</b> ${a.effort}</span>
        <span><b>Confidence:</b> ${typeof a.confidence === 'number' ? a.confidence : ({ High: 90, Medium: 70, Low: 50 }[a.confidence] || 70)}%</span>
      </div>
    </div>`).join('') || '<p style="color:#78716c;font-size:13px">No actions recommended.</p>';

  // ── Assemble full HTML ─────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Atlas Brief — ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1c1917; background: #fff; max-width: 760px; margin: 0 auto; padding: 48px 40px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1c1917">
    <div>
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#78716c;text-transform:uppercase;margin-bottom:8px">Atlas Business Brief · ${period} · ${dateStr}</div>
      <h1 style="font-size:28px;font-weight:600;letter-spacing:-0.02em;line-height:1.2">${name}</h1>
      <div style="font-size:14px;color:#78716c;margin-top:4px">${category}${location ? ' · ' + location : ''}</div>
    </div>
    <div style="text-align:right">
      <div style="width:40px;height:40px;border-radius:10px;background:#1c1917;display:flex;align-items:center;justify-content:center;margin-left:auto">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 16 12 6l5 10M9 13h6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div style="font-size:11px;color:#78716c;margin-top:6px;font-weight:500">ATLAS AI</div>
    </div>
  </div>

  <!-- Metrics -->
  <h2 style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#78716c;margin-bottom:16px">Performance Summary</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:40px">
    <thead>
      <tr>
        <th style="text-align:left;font-size:11px;color:#78716c;font-weight:500;padding-bottom:8px;border-bottom:1px solid #e5e7eb">Metric</th>
        <th style="text-align:left;font-size:11px;color:#78716c;font-weight:500;padding-bottom:8px;border-bottom:1px solid #e5e7eb">Value</th>
        <th style="text-align:left;font-size:11px;color:#78716c;font-weight:500;padding-bottom:8px;border-bottom:1px solid #e5e7eb">Change</th>
      </tr>
    </thead>
    <tbody>${metricRows || '<tr><td colspan="3" style="padding:10px 0;color:#78716c;font-size:13px">No metrics available.</td></tr>'}</tbody>
  </table>

  <!-- Revenue chart -->
  ${revenueSeries.length > 0 ? `
  <h2 style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#78716c;margin-bottom:16px">Revenue Trend</h2>
  <div style="margin-bottom:40px">${sparkHtml}</div>` : ''}

  <!-- Insights -->
  <h2 style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#78716c;margin-bottom:16px">Why It's Happening</h2>
  <div style="margin-bottom:40px">${insightItems}</div>

  <!-- Actions -->
  <h2 style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#78716c;margin-bottom:16px">What To Do Next</h2>
  <div style="margin-bottom:48px">${actionItems}</div>

  <!-- Footer -->
  <div style="padding-top:24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#78716c">Generated by Atlas AI · ${dateStr}</div>
    <div style="font-size:11px;color:#a8a29e">Data is indicative. Verify with your own records before acting.</div>
  </div>

  <script>
    // Auto-print dialog on load so the user can immediately save as PDF
    window.onload = () => { window.print(); };
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // Revoke after a reasonable delay to free memory
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    // Popup blocked — fall back to download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `Atlas_Brief_${name.replace(/\s+/g, '_')}_${period}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
