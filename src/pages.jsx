import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader, SkeletonLine, SkeletonChart } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI } from './api';
import { Tasks } from './Tasks';
import { buildDemoData } from './mockData';
import { downloadReport as generateAndDownload } from './reportGenerator';

// Import and re-export the real Automations engine
import { Automations } from './Automations';
export { Automations };

// Tabbed dashboard pages
const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

export const Analytics = ({ business: initialBusiness }) => {
  const isDemo = DEMO_IDS.includes(initialBusiness?.id) || initialBusiness?.isDemo;
  const safeBusiness = initialBusiness?.id ? initialBusiness : null;
  const [range, setRange] = React.useState('6M');
  const [metrics, setMetrics] = React.useState(initialBusiness?.metrics || {});
  const [loading, setLoading] = React.useState(false);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState('');
  const fileInputRef = React.useRef(null);

  // Bug #19: charts were always reading initialBusiness props, ignoring range changes.
  // Store series in local state so range filter actually updates the charts.
  const [revenueSeries, setRevenueSeries]     = React.useState(initialBusiness?.revenueSeries || []);
  const [customerGrowth, setCustomerGrowth]   = React.useState(initialBusiness?.customerGrowth || []);
  const [ordersSeries, setOrdersSeries]       = React.useState(initialBusiness?.ordersSeries || []);

  // Keep series in sync when the selected range or the business changes
  React.useEffect(() => {
    if (!safeBusiness?.id) return;

    if (DEMO_IDS.includes(safeBusiness.id)) {
      const { series, customerSeries, metrics: scaledMetrics } = buildDemoData(safeBusiness, range);
      setRevenueSeries(series);
      setCustomerGrowth(customerSeries);
      setOrdersSeries(safeBusiness?.ordersSeries || []);
      setMetrics(scaledMetrics);
      return;
    }

    // Real business: fetch series from API
    Promise.all([
      AtlasAPI.metrics.series(safeBusiness.id, 'revenue'),
      AtlasAPI.metrics.series(safeBusiness.id, 'customerGrowth'),
      AtlasAPI.metrics.series(safeBusiness.id, 'orders'),
    ]).then(([rev, cust, ord]) => {
      if (rev?.series?.length)  setRevenueSeries(rev.series);
      if (cust?.series?.length) setCustomerGrowth(cust.series);
      if (ord?.series?.length)  setOrdersSeries(ord.series);
    }).catch(console.error);
  }, [range, safeBusiness?.id]);

  React.useEffect(() => {
    if (!safeBusiness?.id || DEMO_IDS.includes(safeBusiness.id)) return;
    setLoading(true);
    AtlasAPI.metrics.summary(safeBusiness.id, range)
      .then(res => { if (res && Object.keys(res).length > 0) setMetrics(res); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [safeBusiness?.id, range]);

  const handleImportExcel = async (file) => {
    if (!file || !safeBusiness?.id) {
      setImportMessage('No business selected');
      setTimeout(() => setImportMessage(''), 2000);
      return;
    }
    setImportLoading(true);
    setImportMessage('Importing metrics...');
    try {
      const result = await AtlasAPI.metrics.importExcel(safeBusiness.id, file);
      setImportMessage(`✓ Successfully updated metrics for ${result.totalUpdated || 0} business(es)`);
      setTimeout(() => setImportMessage(''), 4000); // Fix #65: 4s for success
    } catch (error) {
      setImportMessage(`✗ Error: ${error.message || 'Failed to import metrics'}`);
      setTimeout(() => setImportMessage(''), 6000); // Fix #65: 6s for errors — was 2s, too fast to read
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await AtlasAPI.metrics.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'metrics-template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const fallbackMetric = { value: 0, delta: 0, label: 'No data', unit: '', period: '' };
  const revenue = metrics.revenue || fallbackMetric;

  if (!safeBusiness) {
    return (
      <div style={{ padding: '64px 32px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12, color: 'var(--ink-2)' }}>Select a business</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32, lineHeight: 1.5 }}>
          Choose a business from the sidebar to view analytics.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Trends"
        title="Analytics"
        subtitle="Cross-source trends with applied filters."
        action={
          <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {['7D', '1M', '3M', '6M', '1Y'].map(p => (
              <button key={p} onClick={() => setRange(p)} style={{
                padding: '4px 10px', border: 'none', borderRadius: 4,
                background: range === p ? 'var(--bg-elevated)' : 'transparent',
                boxShadow: range === p ? 'var(--shadow-xs)' : 'none',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
                color: range === p ? 'var(--ink-1)' : 'var(--ink-3)',
              }}>{p}</button>
            ))}
          </div>
        }
      />

      {/* Import Metrics — real businesses only */}
      {!isDemo && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Import metrics</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>Upload a CSV or Excel file to update your metrics history</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImportExcel(e.target.files[0])} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm" disabled={importLoading}>
                {importLoading ? 'Importing…' : 'Upload Excel'}
              </button>
              <button onClick={downloadTemplate} className="btn btn-sm btn-ghost">Template</button>
            </div>
          </div>
          {importMessage && (
            <div style={{ marginTop: 10, padding: '8px 12px', fontSize: 12, borderRadius: 4, background: importMessage.includes('✓') ? '#dcfce7' : '#fee2e2', color: importMessage.includes('✓') ? '#166534' : '#991b1b' }}>
              {importMessage}
            </div>
          )}
        </div>
      )}

      {/* Revenue + Customer growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>
                {loading ? <SkeletonLine width={120} height={22}/> : fmtINR(revenue.value)}
              </div>
            </div>
            {!loading && revenue.delta != null && <Delta value={revenue.delta}/>}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={revenueSeries} xKey={revenueSeries[0]?.d !== undefined ? 'd' : 'm'}/>}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine width={80} height={22}/> : (customerGrowth.at(-1)?.v || 0).toLocaleString('en-IN')}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={customerGrowth} xKey={customerGrowth[0]?.d !== undefined ? 'd' : 'm'}/>}
        </div>
      </div>

      {/* Orders + Top movers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Orders by day</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine width={100} height={22}/> : `${ordersSeries.reduce((s, d) => s + (d.v || 0), 0).toLocaleString('en-IN')} orders`}
          </div>
          {loading ? <SkeletonChart /> : <BarChart data={ordersSeries} xKey={ordersSeries[0]?.d !== undefined ? 'd' : 'm'}/>}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>Top movers</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4,5].map(i => <SkeletonLine key={i} height={14}/>)}
            </div>
          ) : (safeBusiness?.topMovers || []).length > 0 ? (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ textAlign: 'left', fontWeight: 500, color: 'var(--ink-4)', fontSize: 11, paddingBottom: 8 }}>Item</th>
                  <th style={{ textAlign: 'right', fontWeight: 500, color: 'var(--ink-4)', fontSize: 11, paddingBottom: 8 }}>Units</th>
                  <th style={{ textAlign: 'right', fontWeight: 500, color: 'var(--ink-4)', fontSize: 11, paddingBottom: 8 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {(safeBusiness.topMovers || []).slice(0, 5).map(([name, units, delta], i) => (
                  <tr key={i} style={{ borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '8px 0', color: 'var(--ink-1)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{units}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}><Delta value={delta}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-4)', paddingTop: 8 }}>No sales data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Client-side CSV parser (no deps) ─────────────────────────────────────────
const parseCSVClient = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], headers: [] };
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delim).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(delim).map(v => v.replace(/^["']|["']$/g, '').trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  }).filter(r => Object.values(r).some(v => v));
  return { rows, headers };
};

const money = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, ''));
  return isFinite(n) ? n : 0;
};

const extractCountsFromRows = (rows, headers) => {
  const h = headers;
  const counts = {};
  if (h.some(x => /order|invoice|sale|bill|amount|total|revenue/.test(x))) counts.orders = rows.length;
  if (h.some(x => /stock|inventory|on.hand/.test(x))) counts.inventory = rows.length;
  if (h.some(x => /customer|client/.test(x)) && !counts.orders) counts.customers = rows.length;
  if (h.some(x => /rating|review|stars/.test(x))) counts.reviews = rows.length;
  if (!Object.keys(counts).length) counts.records = rows.length;
  return counts;
};

const buildPreviewLines = (rows, headers) => {
  const lines = [];
  const amtKey = headers.find(x => /total|amount|revenue|sales/.test(x));
  if (amtKey) {
    const total = rows.reduce((s, r) => s + money(r[amtKey]), 0);
    if (total > 0) lines.push(`Total value ₹${total.toLocaleString('en-IN')}`);
  }
  const dateKey = headers.find(x => /date|created/.test(x));
  if (dateKey) {
    const dates = rows.map(r => r[dateKey]).filter(Boolean).sort();
    if (dates.length > 1) lines.push(`${dates[0]} → ${dates[dates.length - 1]}`);
  }
  const nameKey = headers.find(x => /product|item|sku/.test(x));
  if (nameKey) {
    const uniq = new Set(rows.map(r => r[nameKey]).filter(Boolean));
    if (uniq.size) lines.push(`${uniq.size} unique items`);
  }
  const ratingKey = headers.find(x => /rating|stars/.test(x));
  if (ratingKey) {
    const ratings = rows.map(r => money(r[ratingKey])).filter(n => n > 0);
    if (ratings.length) lines.push(`Avg rating ${(ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1)}/5`);
  }
  return lines;
};

export const DataSources = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [dragOver, setDragOver] = React.useState(false);
  const [phase, setPhase] = React.useState('idle'); // idle | reading | parsing | done | error
  const [phaseMsg, setPhaseMsg] = React.useState('');
  const [uploads, setUploads] = React.useState([]);
  const [extractResult, setExtractResult] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const [sources, setSources] = React.useState([
    { id: 'square', name: 'Square POS', status: 'available', last: 'Connect', icon: 'database', mock: true },
    { id: 'gbiz', name: 'Google Business', status: 'available', last: 'Connect', icon: 'globe', mock: true },
    { id: 'instagram', name: 'Instagram', status: 'available', last: 'Connect', icon: 'image', mock: true },
    { id: 'inventory', name: 'Inventory system', status: 'available', last: 'Connect', icon: 'package', mock: false },
  ]);

  const refreshUploads = React.useCallback(async () => {
    if (!business?.id || isDemo) return;
    try {
      const list = await AtlasAPI.uploads.list(business.id);
      setUploads(list || []);
    } catch (err) {
      console.error('Failed to fetch uploads', err);
    }
  }, [business?.id, isDemo]);

  React.useEffect(() => {
    refreshUploads();
    const interval = setInterval(() => {
      if (uploads.some(u => u.status === 'processing' || u.status === 'queued')) refreshUploads();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshUploads, uploads]);

  const handleConnect = async (sourceId) => {
    if (!business?.id || isDemo) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'connected', last: 'Connected just now' } : s));
      return;
    }
    try {
      await AtlasAPI.sources.connect(business.id, sourceId);
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'connected', last: 'Connected' } : s));
    } catch (err) {
      alert('Connection failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUploadFile = async (file) => {
    if (!file || !business?.id) return;
    setExtractResult(null);
    const ext = file.name.split('.').pop().toLowerCase();

    if (isDemo) {
      setPhase('reading'); setPhaseMsg(`Reading ${file.name}…`);
      await new Promise(r => setTimeout(r, 300));

      let counts = {}, preview = [], rowCount = 0;

      if (['csv', 'txt'].includes(ext)) {
        setPhase('parsing'); setPhaseMsg('Parsing rows…');
        const text = await file.text();
        const { rows, headers } = parseCSVClient(text);
        await new Promise(r => setTimeout(r, 400));
        counts = extractCountsFromRows(rows, headers);
        preview = buildPreviewLines(rows, headers);
        rowCount = rows.length;
      } else if (['xlsx', 'xls'].includes(ext)) {
        await new Promise(r => setTimeout(r, 600));
        counts = { records: '?' };
        preview = ['Excel parsed — connect a real account for full extraction'];
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        setPhase('parsing'); setPhaseMsg('Running OCR…');
        await new Promise(r => setTimeout(r, 800));
        counts = { records: 1 };
        preview = ['Image received — OCR requires Google Vision API key in backend'];
      } else if (ext === 'pdf') {
        setPhase('parsing'); setPhaseMsg('Extracting text…');
        await new Promise(r => setTimeout(r, 700));
        counts = { records: 1 };
        preview = ['PDF received — text extraction runs on the backend'];
      } else {
        counts = { records: 1 };
      }

      const entry = {
        id: `demo-${Date.now()}`,
        originalName: file.name,
        mimeType: file.type,
        status: 'complete',
        stage: 'complete',
        createdAt: new Date().toISOString(),
        counts,
        preview,
        rowCount,
      };
      setUploads(prev => [entry, ...prev]);
      setExtractResult({ fileName: file.name, counts, preview, rowCount });
      setPhase('done');
      setPhaseMsg(`✓ ${file.name}${rowCount ? ` — ${rowCount} rows` : ''}`);
      setTimeout(() => { setPhase('idle'); setPhaseMsg(''); }, 5000);

    } else {
      // Real business — upload then poll
      setPhase('reading'); setPhaseMsg(`Uploading ${file.name}…`);
      try {
        const res = await AtlasAPI.uploads.upload(business.id, file);
        const uploadId = res.uploadId;
        setPhase('parsing'); setPhaseMsg('Processing on server…');
        refreshUploads();

        let attempts = 0;
        const poll = async () => {
          if (attempts++ > 30) return;
          const job = await AtlasAPI.uploads.status(business.id, uploadId).catch(() => null);
          if (!job) return;
          if (job.status === 'complete') {
            const counts = job.normalized?.counts || {};
            const total = Object.values(counts).reduce((s, v) => s + (v || 0), 0);
            setExtractResult({ fileName: file.name, counts, preview: [`${total} records extracted`, `via ${job.extracted?.provider || 'deterministic'} parser`], rowCount: total });
            setPhase('done'); setPhaseMsg(`✓ ${file.name} — ${total} records`);
            setTimeout(() => { setPhase('idle'); setPhaseMsg(''); }, 5000);
            refreshUploads();
          } else if (job.status === 'failed') {
            setPhase('error'); setPhaseMsg(`✗ ${job.error || 'Processing failed'}`);
            setTimeout(() => { setPhase('idle'); setPhaseMsg(''); }, 6000);
            refreshUploads();
          } else {
            setTimeout(poll, 3000);
          }
        };
        setTimeout(poll, 2000);
      } catch (err) {
        setPhase('error'); setPhaseMsg(`✗ ${err.message || 'Upload failed'}`);
        setTimeout(() => { setPhase('idle'); setPhaseMsg(''); }, 6000);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleUploadFile(file);
  };

  const busy = phase === 'reading' || phase === 'parsing';

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Inputs" title="Data sources" subtitle="Connect sources for insights. Revenue from Square POS, sentiment from Google Business."/>

      {/* Drop zone */}
      <div
        className="card"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !busy && fileInputRef.current?.click()}
        style={{
          padding: 28, textAlign: 'center', cursor: busy ? 'default' : 'pointer',
          marginBottom: 16, transition: 'all 120ms',
          border: dragOver ? '2px solid var(--ink-1)' : busy ? '2px solid var(--border)' : '2px dashed var(--border)',
          background: dragOver ? 'var(--bg-subtle)' : 'transparent',
        }}
      >
        {busy && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--ink-1)', animation: 'spin 1s linear infinite' }}/>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{phaseMsg}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
              {phase === 'reading' ? 'Reading file…' : 'Extracting orders, inventory, customers…'}
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={18} color="#16a34a" strokeWidth={2.5}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--positive)' }}>{phaseMsg}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Click to upload another file</div>
          </div>
        )}
        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-circle" size={24} color="var(--negative)"/>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--negative)' }}>{phaseMsg}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Click to try again</div>
          </div>
        )}
        {phase === 'idle' && (
          <>
            <Icon name="upload" size={20}/>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>Drop files here or click to browse</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>CSV, PDF, Excel, images — orders, inventory, reviews, customers</div>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.txt" style={{ display: 'none' }} onChange={handleFileSelect}/>

      {/* Extraction result */}
      {extractResult && (
        <div className="card fade-in" style={{ padding: 18, marginBottom: 16, borderColor: 'var(--positive)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="check" size={14} color="#16a34a" strokeWidth={2.5}/>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{extractResult.fileName}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Extracted and ready</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setExtractResult(null)}>
              <Icon name="x" size={12}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: extractResult.preview.length ? 10 : 0 }}>
            {Object.entries(extractResult.counts).map(([key, val]) => (
              <div key={key} style={{ padding: '6px 14px', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'capitalize' }}>{key}</div>
              </div>
            ))}
          </div>
          {extractResult.preview.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {extractResult.preview.map((line, i) => (
                <span key={i} className="badge" style={{ fontSize: 11 }}>{line}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload history */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent uploads</div>
          <div className="card">
            {uploads.map((u, i) => (
              <div key={u.id} style={{ padding: '12px 16px', borderBottom: i === uploads.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon name={u.mimeType?.includes('image') ? 'image' : 'file'} size={14} color="var(--ink-3)" style={{ marginTop: 2 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.originalName || u.fileName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: u.counts ? 6 : 0 }}>
                    {u.stage} · {new Date(u.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {u.counts && Object.keys(u.counts).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(u.counts).map(([k, v]) => v > 0 && (
                        <span key={k} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--bg-subtle)', color: 'var(--ink-3)', fontWeight: 500 }}>
                          {v} {k}
                        </span>
                      ))}
                    </div>
                  )}
                  {u.preview?.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{u.preview.join(' · ')}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: u.status === 'failed' ? 'var(--negative)' : u.status === 'complete' ? 'var(--positive)' : 'var(--warning)' }}>
                    {u.status === 'complete' ? '● Done' : u.status === 'failed' ? '● Failed' : '○ Processing'}
                  </span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => {
                    if (isDemo) {
                      setUploads(prev => prev.filter(x => x.id !== u.id));
                      if (extractResult?.fileName === (u.originalName || u.fileName)) setExtractResult(null);
                    } else {
                      AtlasAPI.uploads.delete(business.id, u.id).then(refreshUploads);
                    }
                  }}>
                    <Icon name="x" size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Available integrations</div>
      <div className="card">
        {sources.map((s, i) => (
          <div key={i} style={{ padding: 16, borderBottom: i === sources.length - 1 ? 'none' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name={s.icon} size={16}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.last}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.status === 'connected' ? (
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-positive)', borderRadius: 4, color: 'var(--ink-1)' }}>Connected</span>
                ) : (
                  <button className="btn btn-sm" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => handleConnect(s.id)} disabled={busy}>
                    Connect
                  </button>
                )}
                {s.mock && <span className="badge" style={{ background: 'var(--warning)', color: 'var(--warning-fg)' }}>Mock</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Reports = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [reports, setReports] = React.useState([]);
  const [generating, setGenerating] = React.useState(false);
  const [message, setMessage] = React.useState('');

  // Load existing reports for real businesses
  React.useEffect(() => {
    if (!business?.id || isDemo) return;
    AtlasAPI.reports.list(business.id).then(list => {
      if (list?.length) setReports(list);
    }).catch(console.error);
  }, [business?.id, isDemo]);

  const handleGenerate = async (type = 'weekly') => {
    setGenerating(true);
    setMessage('');
    try {
      const reportMeta = {
        id: `report-${Date.now()}`,
        name: type === 'monthly' ? 'Monthly performance brief' : 'Weekly performance brief',
        type,
        createdAt: new Date().toISOString(),
        status: 'ready',
      };

      if (!isDemo) {
        // Register with backend so it appears in history
        const created = await AtlasAPI.reports.create(business.id, type).catch(() => reportMeta);
        reportMeta.id = created.id || reportMeta.id;
      }

      setReports(prev => [reportMeta, ...prev]);
      setMessage('✓ Report ready — click Download PDF');
    } catch (err) {
      setMessage(`✗ ${err.message || 'Generation failed'}`);
    } finally {
      setGenerating(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDownload = async (report) => {
    // Always generate client-side — works for demo and real businesses
    // For real businesses, also try the backend PDF as a fallback
    if (!isDemo && !report.id.startsWith('report-')) {
      try {
        // Fetch with auth headers and convert to blob
        const token = sessionStorage.getItem('atlas-token') || localStorage.getItem('atlas-token') || '';
        const res = await fetch(
          `/api/v1/businesses/${business.id}/reports/${report.id}/download`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Atlas_Report_${(business.name || 'report').replace(/\s+/g, '_')}.pdf`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          return;
        }
      } catch {
        // Fall through to client-side generation
      }
    }
    // Client-side HTML report (opens in new tab with print-to-PDF button)
    generateAndDownload(business, '1M', `Atlas_Brief_${(business.name || 'report').replace(/\s+/g, '_')}.html`);
  };

  if (!business) return <div style={{ padding: 64 }}>Select a business.</div>;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Intelligence" title="Reports" subtitle="Export data-backed business briefs."/>

      {/* Report types */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { type: 'weekly', label: 'Weekly performance brief', desc: 'Revenue, insights, and recommended actions for the past 7 days.' },
          { type: 'monthly', label: 'Monthly business summary', desc: 'Full month overview with trends, top movers, and spending analysis.' },
        ].map(({ type, label, desc }) => (
          <div key={type} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="file-text" size={16} color="var(--ink-3)"/>
              </span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, flex: 1 }}>{desc}</div>
            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => handleGenerate(type)}
              disabled={generating}
            >
              <Icon name="download" size={13}/> {generating ? 'Generating…' : 'Generate report'}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, background: message.includes('✓') ? '#dcfce7' : '#fee2e2', color: message.includes('✓') ? '#166534' : '#991b1b' }}>
          {message}
        </div>
      )}

      {/* History */}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>History</div>
      <div className="card">
        {reports.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
            No reports generated yet. Click "Generate report" above to create your first brief.
          </div>
        ) : (
          reports.map((r, i) => (
            <div key={r.id} style={{ padding: '14px 16px', borderBottom: i === reports.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="file" size={14} color="var(--ink-3)"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name || `${r.type} report`}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                  {new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {r.status === 'ready' && <span style={{ marginLeft: 8, color: 'var(--positive)', fontWeight: 500 }}>● Ready</span>}
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => handleDownload(r)}>
                <Icon name="download" size={13}/> Download PDF
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const Settings = ({ business, onRefresh }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [saved, setSaved] = React.useState(false);
  const [goals, setGoals] = React.useState(() => {
    try { return JSON.parse(business?.goals || '[]'); } catch { return []; }
  });
  const debounceRef = React.useRef({});

  if (!business) return <div style={{ padding: 64, textAlign: 'center', color: 'var(--ink-3)' }}>Select a business to view settings.</div>;

  const debouncedUpdate = (field, value) => {
    if (isDemo) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    clearTimeout(debounceRef.current[field]);
    debounceRef.current[field] = setTimeout(async () => {
      try {
        await AtlasAPI.businesses.update(business.id, { [field]: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (onRefresh) onRefresh();
      } catch (err) { console.error('Settings update failed', err); }
    }, 500);
  };

  const toggleGoal = (goalId) => {
    const next = goals.includes(goalId) ? goals.filter(g => g !== goalId) : [...goals, goalId];
    setGoals(next);
    debouncedUpdate('goals', JSON.stringify(next));
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Workspace"
        title="Settings"
        action={saved ? (
          <span style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="check" size={13} color="var(--positive)"/> Saved
          </span>
        ) : null}
      />

      {isDemo && (
        <div style={{ padding: '10px 14px', borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
          Demo mode — changes are local only and won't persist after refresh.
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Business info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Business name</label>
            <input className="input" defaultValue={business.name || ''} onChange={(e) => debouncedUpdate('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Category</label>
            <input className="input" defaultValue={business.category || ''} onChange={(e) => debouncedUpdate('category', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Location</label>
            <input className="input" defaultValue={business.location || business.address || ''} onChange={(e) => debouncedUpdate('location', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Owner name</label>
            <input className="input" defaultValue={business.owner || ''} onChange={(e) => debouncedUpdate('owner', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Business goals</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>Atlas prioritises insights and actions based on these goals.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { id: 'rev', label: 'Grow revenue' },
            { id: 'repeat', label: 'Increase repeat customers' },
            { id: 'inv', label: 'Reduce inventory waste' },
            { id: 'csat', label: 'Improve customer satisfaction' },
          ].map(goal => (
            <button
              key={goal.id}
              className={`btn btn-sm ${goals.includes(goal.id) ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleGoal(goal.id)}
            >
              {goals.includes(goal.id) && <Icon name="check" size={11}/>}
              {goal.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main tabbed component
export const Pages = ({ business, onRefresh, initialTab }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab || 'analytics');

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const pageComponents = {
    analytics: Analytics,
    sources: DataSources,
    tasks: Tasks,
    automations: Automations,
    reports: Reports,
    settings: Settings,
  };
  const ActiveComponent = pageComponents[activeTab] || Analytics;

  return <ActiveComponent business={business} onRefresh={onRefresh} />;
};
