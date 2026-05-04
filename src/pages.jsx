import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader, SkeletonLine, SkeletonChart } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI, logError } from './api';
import { Tasks } from './Tasks';
import { buildDemoData } from './mockData';
import { downloadReport as generateAndDownload } from './reportGenerator';

// Import and re-export the real Automations engine
import { Automations } from './Automations';
export { Automations };

import { Records } from './Records';
export { Records };

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
      const { series, customerSeries, ordersSeries: scaledOrders, metrics: scaledMetrics } = buildDemoData(safeBusiness, range);
      setRevenueSeries(series);
      setCustomerGrowth(customerSeries);
      setOrdersSeries(scaledOrders);
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

  // Helper to determine xKey for series data (handles empty arrays and both 'd'/'m' formats)
  const getXKey = (series) => {
    const s = series || [];
    if (s.length === 0) return 'm';
    return s[0].d !== undefined ? 'd' : 'm';
  };

  // Helper to safely get last element (backward-compatible with .at(-1))
  const getLast = (arr) => {
    const s = arr || [];
    return s[s.length - 1];
  };

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
          {loading ? <SkeletonChart /> : <LineChart data={revenueSeries} xKey={getXKey(revenueSeries)}/>}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine width={80} height={22}/> : (getLast(customerGrowth)?.v || 0).toLocaleString('en-IN')}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={customerGrowth} xKey={getXKey(customerGrowth)}/>}
        </div>
      </div>

      {/* Orders + Top movers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Orders by day</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine width={100} height={22}/> : `${(ordersSeries || []).reduce((s, d) => s + (d.v || 0), 0).toLocaleString('en-IN')} orders`}
          </div>
          {loading ? <SkeletonChart /> : <BarChart data={ordersSeries} xKey={getXKey(ordersSeries)}/>}
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

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
const ChatPanel = ({ business, onClose }) => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const bottomRef = React.useRef();
  const inputRef = React.useRef();
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;

  React.useEffect(() => {
    if (isDemo) {
      setMessages([{ id: 'welcome', role: 'assistant', content: `Hi! I'm Atlas. Tell me about your sales, customers, or inventory in plain language and I'll record it. Try: "Sold 3 chocolate cakes to Priya for ₹1,200 today, she loved it!"`, createdAt: new Date().toISOString() }]);
      setLoading(false);
      return;
    }
    AtlasAPI.chat.list(business.id)
      .then(msgs => {
        const withWelcome = msgs.length === 0
          ? [{ id: 'welcome', role: 'assistant', content: `Hi! I'm Atlas. Tell me about your business activity in plain language and I'll record it automatically. Try: "Sold 5 units of product X to Rahul for ₹2,500 today"`, createdAt: new Date().toISOString() }]
          : msgs;
        setMessages(withWelcome);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [business?.id, isDemo]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      const demoReply = { id: `a-${Date.now()}`, role: 'assistant', content: `Got it! In a real account, I'd extract and store that data automatically. Create your own business to enable full AI recording.`, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, demoReply]);
      setSending(false);
      return;
    }

    try {
      const res = await AtlasAPI.chat.send(business.id, text);
      setMessages(prev => [...prev, res.message]);
    } catch (e) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: 'Something went wrong. Try again.', createdAt: new Date().toISOString() }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, width: 380, height: 520, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={15} color="white"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Atlas Chat</div>
          <div style={{ fontSize: 11, color: 'var(--positive)' }}>● Records everything you say</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isDemo && messages.length > 1 && (
            <button className="btn btn-ghost btn-sm" style={{ padding: 4, fontSize: 10 }} onClick={async () => { await AtlasAPI.chat.clear(business.id); setMessages([{ id: 'welcome', role: 'assistant', content: 'Chat cleared. Start fresh!', createdAt: new Date().toISOString() }]); }}>
              Clear
            </button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onClose}>
            <Icon name="x" size={14}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink-1)', animation: 'spin 600ms linear infinite' }}/>
          </div>
        ) : messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? 'var(--ink-1)' : 'var(--bg-subtle)',
              color: m.role === 'user' ? 'white' : 'var(--ink-1)',
              fontSize: 13, lineHeight: 1.5,
            }}>
              {m.content}
              {m.extracted && (() => {
                try {
                  const ex = typeof m.extracted === 'string' ? JSON.parse(m.extracted) : m.extracted;
                  const total = Object.values(ex).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0);
                  if (total > 0) return (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 10, opacity: 0.8 }}>
                      ✓ Recorded {total} item{total > 1 ? 's' : ''}
                    </div>
                  );
                } catch { return null; }
                return null;
              })()}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '9px 13px', borderRadius: '14px 14px 14px 4px', background: 'var(--bg-subtle)', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-3)', animation: `bounce 1s ${i * 0.15}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          className="input"
          style={{ flex: 1, fontSize: 13 }}
          placeholder="Tell me about a sale, customer, review…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={sending}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={sending || !input.trim()} style={{ padding: '0 12px' }}>
          <Icon name="arrow-right" size={14}/>
        </button>
      </div>
    </div>
  );
};

export const DataSources = ({ business }) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  const [dragOver, setDragOver] = React.useState(false);
  const [phase, setPhase] = React.useState('idle');
  const [phaseMsg, setPhaseMsg] = React.useState('');
  const [uploads, setUploads] = React.useState([]);
  const [extractResult, setExtractResult] = React.useState(null);
  const [showChat, setShowChat] = React.useState(false);
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
      if (uploads.some(u => u.status === 'processing' || u.status === 'queued' || u.status === 'pending_review')) refreshUploads();
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

  const handleDisconnect = async (sourceId) => {
    if (!business?.id || isDemo) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'available', last: 'Connect' } : s));
      return;
    }
    try {
      await AtlasAPI.sources.disconnect(business.id, sourceId);
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'available', last: 'Connect' } : s));
    } catch (err) {
      alert('Disconnect failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSync = async (sourceId) => {
    if (isDemo) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, last: 'Synced just now' } : s));
      return;
    }
    try {
      await AtlasAPI.sources.sync(business.id, sourceId);
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, last: 'Synced just now' } : s));
    } catch (err) {
      alert('Sync failed: ' + (err.message || 'Unknown error'));
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
      <SectionHeader eyebrow="Inputs" title="Data sources" subtitle="Connect sources for insights. Revenue from Square POS, sentiment from Google Business."
        action={
          <button className="btn btn-primary btn-sm" onClick={() => setShowChat(p => !p)}>
            <Icon name="message" size={13}/> Chat with Atlas
          </button>
        }
      />
      {showChat && <ChatPanel business={business} onClose={() => setShowChat(false)}/>}

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

      {/* Upload history — with AI review cards for pending_review items */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent uploads</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uploads.map((u) => {
              const extracted = (() => { try { return JSON.parse(u.extracted ? JSON.stringify(u.extracted) : '{}'); } catch { return {}; } })();
              const summary = extracted.summary || null;
              const isPendingReview = u.status === 'pending_review';

              if (isPendingReview && summary) {
                return (
                  <div key={u.id} className="card fade-in" style={{ padding: 20, borderColor: '#f59e0b', borderWidth: 1.5 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="sparkles" size={14} color="#d97706"/>
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.originalName || u.fileName}</div>
                        <div style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>Atlas has read this — review before adding to analytics</div>
                      </div>
                    </div>

                    {/* AI summary */}
                    <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                      {summary.useful ? (
                        <>
                          {summary.lines.map((line, i) => <div key={i}>{line}</div>)}
                        </>
                      ) : (
                        <div style={{ color: 'var(--ink-3)' }}>
                          {summary.lines[0] || 'No structured data found in this document.'}
                        </div>
                      )}
                    </div>

                    {/* Impact preview */}
                    {summary.useful && summary.impact?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>If you confirm, Atlas will:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {summary.impact.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                              <Icon name="arrow-right" size={11} color="var(--positive)"/>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {summary.useful ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={async () => {
                              try {
                                await AtlasAPI.uploads.confirm(business.id, u.id);
                                refreshUploads();
                              } catch (e) { alert('Failed: ' + e.message); }
                            }}
                          >
                            <Icon name="check" size={12}/> Yes, add to analytics
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={async () => {
                              await AtlasAPI.uploads.reject(business.id, u.id);
                              refreshUploads();
                            }}
                          >
                            Discard
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={async () => {
                            await AtlasAPI.uploads.reject(business.id, u.id);
                            refreshUploads();
                          }}
                        >
                          <Icon name="x" size={12}/> Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Normal upload row
              return (
                <div key={u.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Icon name={u.mimeType?.includes('image') ? 'image' : 'file'} size={14} color="var(--ink-3)" style={{ marginTop: 2 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.originalName || u.fileName}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {u.stage} · {new Date(u.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: u.status === 'failed' ? 'var(--negative)' : u.status === 'complete' ? 'var(--positive)' : u.status === 'rejected' ? 'var(--ink-4)' : 'var(--warning)' }}>
                      {u.status === 'complete' ? '● Done' : u.status === 'failed' ? '● Failed' : u.status === 'rejected' ? '● Discarded' : '○ Processing'}
                    </span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => {
                      if (isDemo) {
                        setUploads(prev => prev.filter(x => x.id !== u.id));
                      } else {
                        AtlasAPI.uploads.delete(business.id, u.id).then(refreshUploads);
                      }
                    }}>
                      <Icon name="x" size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
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
                  <>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => handleSync(s.id)} disabled={busy}>
                      <Icon name="refresh" size={12}/> Sync
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--negative)' }} onClick={() => handleDisconnect(s.id)} disabled={busy}>
                      Disconnect
                    </button>
                  </>
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
    generateAndDownload(business, report.type === 'monthly' ? '1M' : '7D');
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
    records: Records,
    tasks: Tasks,
    automations: Automations,
    reports: Reports,
    settings: Settings,
  };
  const ActiveComponent = pageComponents[activeTab] || Analytics;

  return <ActiveComponent business={business} onRefresh={onRefresh} />;
};
