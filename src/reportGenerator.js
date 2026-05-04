// Client-side report generator — builds a styled HTML report and triggers
// a browser print-to-PDF dialog (or direct download as HTML).
// Works for both demo and real businesses with no external dependencies.

const fmtINR = (v) => {
  if (v == null || isNaN(v)) return '₹0';
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

const severityColor = (s) => ({
  positive: '#15803d', warning: '#b45309', negative: '#dc2626', info: '#1d4ed8',
}[s] || '#374151');

const severityBg = (s) => ({
  positive: '#dcfce7', warning: '#fef3c7', negative: '#fee2e2', info: '#dbeafe',
}[s] || '#f3f4f6');

const severityLabel = (s) => ({
  positive: 'OPPORTUNITY', warning: 'WATCH', negative: 'RISK', info: 'PATTERN',
}[s] || 'INSIGHT');

// Build a mini SVG sparkline from a series array
const sparkline = (series, color = '#1c1917') => {
  if (!series || series.length < 2) return '';
  const vals = series.map(d => d.v || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 200, H = 40, pad = 4;
  const iW = W - pad * 2, iH = H - pad * 2;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * iW;
    const y = pad + iH - ((v - min) / range) * iH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg width="${W}" height="${H}" style="display:block">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
};

export const generateReportHTML = (business, period = '1M') => {
  const m = business.metrics || {};
  const insights = business.insights || [];
  const actions = business.actions || [];
  const series = business.revenueSeries || [];
  const spendMix = business.spendingMix || [];
  const topMovers = business.topMovers || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const metricRows = Object.entries(m).map(([k, v]) => {
    const val = v.unit === '₹' ? fmtINR(v.value) : `${(v.value || 0).toLocaleString('en-IN')}${v.unit || ''}`;
    const delta = v.delta ?? 0;
    const dColor = delta >= 0 ? '#15803d' : '#dc2626';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${v.label || k}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-family:monospace;font-weight:600">${val}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:${dColor};font-weight:500">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:11px;color:#9ca3af">${v.period || period}</td>
    </tr>`;
  }).join('');

  const insightCards = insights.slice(0, 5).map((ins, i) => `
    <div style="margin-bottom:12px;padding:14px 16px;border-radius:8px;border-left:4px solid ${severityColor(ins.severity)};background:${severityBg(ins.severity)}">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;color:${severityColor(ins.severity)};margin-bottom:4px">${severityLabel(ins.severity)}</div>
      <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px">${ins.title}</div>
      <div style="font-size:12px;color:#374151;line-height:1.5">${ins.body}</div>
      ${ins.evidence?.length ? `<div style="margin-top:6px;font-size:10px;color:#6b7280">Evidence: ${ins.evidence.join(' · ')}</div>` : ''}
    </div>`).join('');

  const actionRows = actions.slice(0, 5).map((a, i) => {
    const conf = typeof a.confidence === 'number' ? a.confidence : ({ High: 90, Medium: 70, Low: 50 }[a.confidence] || 70);
    return `<tr style="${a.urgent ? 'background:#fffbeb' : ''}">
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top">
        ${a.urgent ? '<span style="font-size:9px;background:#1c1917;color:white;padding:1px 5px;border-radius:3px;margin-right:6px;font-weight:600">URGENT</span>' : ''}
        <span style="font-size:13px;font-weight:600;color:#111827">${a.title}</span>
        <div style="font-size:11px;color:#6b7280;margin-top:3px;line-height:1.4">${a.body}</div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-family:monospace;font-weight:600;white-space:nowrap;color:#15803d">${a.impact || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;white-space:nowrap">${a.effort || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-family:monospace">${conf}%</td>
    </tr>`;
  }).join('');

  const spendRows = spendMix.map(s => {
    const total = spendMix.reduce((sum, x) => sum + (x.value || 0), 0);
    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
    return `<tr>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.color};margin-right:8px;vertical-align:middle"></span>${s.label}
      </td>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-family:monospace">${fmtINR(s.value)}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280">${pct}%</td>
    </tr>`;
  }).join('');

  const moverRows = topMovers.slice(0, 5).map(([name, units, delta]) => `
    <tr>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px">${name}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-family:monospace">${(units || 0).toLocaleString('en-IN')}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:${delta >= 0 ? '#15803d' : '#dc2626'};font-weight:500">${delta >= 0 ? '+' : ''}${delta}%</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Atlas Brief — ${business.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  .container { max-width: 860px; margin: 0 auto; padding: 40px 32px; }
  h2 { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #f3f4f6; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: #6b7280; text-transform: uppercase; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .section { margin-bottom: 32px; }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1c1917; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; z-index: 100; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
<div class="container">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #111827">
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;margin-bottom:6px">Atlas Business Intelligence</div>
      <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#111827">${business.name}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">${business.category || ''} · ${business.location || business.address || 'India'}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#9ca3af;margin-bottom:2px">Generated</div>
      <div style="font-size:13px;font-weight:600">${dateStr}</div>
      <div style="font-size:12px;color:#6b7280">${timeStr}</div>
      <div style="margin-top:8px;padding:3px 10px;background:#f3f4f6;border-radius:4px;font-size:11px;font-weight:600;display:inline-block">Period: ${period}</div>
    </div>
  </div>

  <!-- Revenue Sparkline -->
  ${series.length > 1 ? `
  <div class="section">
    <h2>Revenue Trend</h2>
    <div style="display:flex;align-items:center;gap:24px;padding:16px;background:#f9fafb;border-radius:8px">
      <div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:2px">Current Period</div>
        <div style="font-size:24px;font-weight:700;font-family:monospace">${fmtINR(m.revenue?.value)}</div>
        <div style="font-size:12px;color:${(m.revenue?.delta || 0) >= 0 ? '#15803d' : '#dc2626'};margin-top:2px;font-weight:500">
          ${(m.revenue?.delta || 0) >= 0 ? '▲' : '▼'} ${Math.abs(m.revenue?.delta || 0)}% vs prev period
        </div>
      </div>
      <div style="flex:1">${sparkline(series, '#1c1917')}</div>
      <div style="font-size:11px;color:#9ca3af;text-align:right">
        ${series[0]?.m || series[0]?.d || ''} → ${series[series.length-1]?.m || series[series.length-1]?.d || ''}
      </div>
    </div>
  </div>` : ''}

  <!-- Key Metrics -->
  <div class="section">
    <h2>Key Metrics</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th><th>Change</th><th>Period</th></tr></thead>
      <tbody>${metricRows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af">No metrics available</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Top Movers -->
  ${moverRows ? `
  <div class="section">
    <h2>Top Selling Items</h2>
    <table>
      <thead><tr><th>Item</th><th>Units</th><th>Change</th></tr></thead>
      <tbody>${moverRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Spending Mix -->
  ${spendRows ? `
  <div class="section">
    <h2>Spending Mix</h2>
    <table>
      <thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead>
      <tbody>${spendRows}</tbody>
    </table>
  </div>` : ''}

  <div class="page-break"></div>

  <!-- Insights -->
  <div class="section">
    <h2>Active Insights (${insights.length})</h2>
    ${insightCards || '<p style="font-size:13px;color:#9ca3af;padding:16px 0">No insights available yet.</p>'}
  </div>

  <!-- Actions -->
  ${actionRows ? `
  <div class="section">
    <h2>Recommended Actions</h2>
    <table>
      <thead><tr><th style="width:55%">Action</th><th>Impact</th><th>Effort</th><th>Confidence</th></tr></thead>
      <tbody>${actionRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#9ca3af">Generated by Atlas AI · ${dateStr}</div>
    <div style="font-size:11px;color:#9ca3af">Data reflects connected sources and business signals</div>
  </div>

</div>
</body>
</html>`;
};

// Trigger download: opens the report in a new tab with a "Save as PDF" button
// The user clicks it → browser print dialog → Save as PDF.
// This avoids popup blockers (new tab is opened synchronously on click).
export const downloadReport = (business, period = '1M', filename) => {
  const html = generateReportHTML(business, period);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Open in new tab — user clicks "Save as PDF" button inside the report
  const tab = window.open(url, '_blank');
  if (!tab) {
    // Popup blocked — fall back to direct download as HTML file
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Atlas_Brief_${(business.name || 'report').replace(/\s+/g, '_')}_${period}.html`;
    a.click();
  }
  // Revoke after a delay to allow the tab to load
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
