import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader, SkeletonLine, SkeletonChart } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI } from './api';
import { Tasks } from './Tasks';

// Tabbed dashboard pages
const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];
const RANGE_SLICE = { '7D': 1, '1M': 2, '3M': 3, '6M': 5, '1Y': 7 };

export const Analytics = ({ business: initialBusiness }) => {
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
      // Demo: slice static series client-side so the filter visibly does something
      const n = RANGE_SLICE[range] ?? (safeBusiness?.revenueSeries?.length || 7);
      setRevenueSeries((safeBusiness?.revenueSeries || []).slice(-n));
      setCustomerGrowth((safeBusiness?.customerGrowth || []).slice(-n));
      setOrdersSeries((safeBusiness?.ordersSeries || []));
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
  }, [range, safeBusiness?.id, safeBusiness?.revenueSeries, safeBusiness?.customerGrowth, safeBusiness?.ordersSeries]);

  React.useEffect(() => {
    if (!safeBusiness?.id) return;
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
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              {['7D', '1M', '3M', '6M', '1Y'].map(p => (
                <button key={p} onClick={() => setRange(p)} style={{ padding: '4px 10px', border: 'none', borderRadius: 4, background: range === p ? 'var(--bg-elevated)' : 'transparent', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        }
      />
      {/* Excel Import */}
      <div className="card" style={{ padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              <Icon name="upload" size={14} style={{ marginRight: 6 }} />
              Import Metrics
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImportExcel(e.target.files[0])} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm" disabled={importLoading}>
              {importLoading ? 'Importing...' : 'Upload Excel'}
            </button>
            <button onClick={downloadTemplate} className="btn btn-sm btn-ghost">
              Template
            </button>
          </div>
        </div>
        {importMessage && (
          <div style={{ marginTop: 12, padding: 8, fontSize: 12, borderRadius: 4, background: importMessage.includes('✓') ? '#dcfce7' : '#fee2e2', color: importMessage.includes('✓') ? '#166534' : '#991b1b' }}>
            {importMessage}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Revenue</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine /> : fmtINR(revenue.value)}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={revenueSeries} xKey={revenueSeries[0]?.d !== undefined ? 'd' : 'm'}/>}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
          {loading ? <SkeletonLine /> : (customerGrowth).at(-1)?.v || '0'}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={customerGrowth} xKey={customerGrowth[0]?.d !== undefined ? 'd' : 'm'}/>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
<div className="card" style={{ padding: 18 }}>
           <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Orders by day</div>
           <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 12 }}>
             {loading ? <SkeletonLine /> : `${((ordersSeries).reduce((s, d) => s + (d.v || 0), 0) || 0)} orders`}
           </div>
           {loading ? <SkeletonChart /> : <BarChart data={ordersSeries} xKey={ordersSeries[0]?.d !== undefined ? 'd' : 'm'}/>}
         </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Top movers</div>
          {loading ? <SkeletonLine /> : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {(safeBusiness?.topMovers || initialBusiness?.topMovers || []).slice(0, 5).map(([name, u, d], i) => (
                  <tr key={i}>
                    <td>{name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{u}</td>
                    <td style={{ textAlign: 'right' }}><Delta value={d} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export const DataSources = ({ business }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const [processing, setProcessing] = React.useState(null);
  const [uploads, setUploads] = React.useState([]);
  const fileInputRef = React.useRef(null);
  
  const [sources, setSources] = React.useState([
    { id: 'square', name: 'Square POS', status: 'available', last: 'Connect', icon: 'database', mock: true },
    { id: 'gbiz', name: 'Google Business', status: 'available', last: 'Connect', icon: 'globe', mock: true },
    { id: 'instagram', name: 'Instagram', status: 'available', last: 'Connect', icon: 'image', mock: true },
    { id: 'inventory', name: 'Inventory system', status: 'available', last: 'Connect', icon: 'package', mock: false },
  ]);

  const refreshUploads = React.useCallback(async () => {
    if (!business?.id || DEMO_IDS.includes(business.id) || business.isDemo) return;
    try {
      const list = await AtlasAPI.uploads.list(business.id);
      setUploads(list || []);
    } catch (err) {
      console.error('Failed to fetch uploads', err);
    }
  }, [business?.id, business?.isDemo]);

  React.useEffect(() => {
    refreshUploads();
    // Poll for status if any upload is still processing
    const interval = setInterval(() => {
      if (uploads.some(u => u.status === 'processing' || u.status === 'queued')) {
        refreshUploads();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshUploads, uploads]);

  const handleConnect = async (sourceId) => {
    if (!business?.id || DEMO_IDS.includes(business.id) || business.isDemo) {
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'connected', last: 'Connected just now' } : s));
      return;
    }
    try {
      setProcessing('Connecting…');
      await AtlasAPI.sources.connect(business.id, sourceId);
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'connected', last: 'Connected' } : s));
    } catch (err) {
      alert('Connection failed: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(null);
    }
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    if (!business?.id) {
      setProcessing('No business selected');
      setTimeout(() => setProcessing(null), 2000);
      return;
    }
    setProcessing('Processing...');
    try {
      if (!DEMO_IDS.includes(business.id) && !business.isDemo) {
        await AtlasAPI.uploads.upload(business.id, file);
        refreshUploads();
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      setProcessing(`✓ ${file.name} uploaded`);
    } catch (err) {
      setProcessing(`✗ Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setProcessing(null), 3000);
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

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Inputs" title="Data sources" subtitle="Connect sources for insights. Revenue from Square POS, sentiment from Google Business."/>
      
       <div 
         className="card"
         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
         onDragLeave={() => setDragOver(false)}
         onDrop={handleDrop}
         onClick={() => fileInputRef.current?.click()}
         style={{ padding: 28, border: dragOver ? '2px solid var(--ink-1)' : '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer', marginBottom: 24, transition: 'all 120ms', background: dragOver ? 'var(--bg-subtle)' : 'transparent' }}
       >
         {processing ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
             <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--ink-1)', animation: 'spin 1s linear infinite' }}/>
             <div style={{ fontSize: 13, fontWeight: 500 }}>{processing}</div>
           </div>
         ) : (
           <>
             <Icon name="upload" size={20} />
             <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>Drop files here</div>
             <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>PDF, CSV, screenshots</div>
           </>
         )}
       </div>
       <input
         ref={fileInputRef}
         type="file"
         accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
         style={{ display: 'none' }}
         onChange={handleFileSelect}
       />

      {uploads.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Uploads</div>
          <div className="card">
            {uploads.map((u, i) => (
              <div key={u.id} style={{ padding: '12px 16px', borderBottom: i === uploads.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name={u.mimeType?.includes('image') ? 'image' : 'file'} size={14} color="var(--ink-3)"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.originalName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{u.stage} • {new Date(u.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, textTransform: 'capitalize', color: u.status === 'failed' ? 'var(--negative)' : u.status === 'complete' ? 'var(--positive)' : 'var(--warning)' }}>
                    {u.status}
                  </span>
                  {u.status === 'failed' && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => AtlasAPI.uploads.delete(business.id, u.id).then(refreshUploads)}>
                      <Icon name="x" size={12}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Available Integrations</div>
      <div className="card">
        {sources.map((s, i) => (
          <div key={i} style={{ padding: 16, borderBottom: i === sources.length - 1 ? 'none' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name={s.icon} size={16} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.last}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {s.status === 'connected' ? (
                  <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-positive)', borderRadius: 4, color: 'var(--ink-1)' }}>Connected</span>
                ) : (
                  <button
                    className="btn btn-sm"
                    style={{ padding: '2px 10px', fontSize: 12 }}
                    onClick={() => handleConnect(s.id)}
                    disabled={!!processing}
                  >
                    {processing ? 'Connecting…' : 'Connect'}
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

// Fix #104: Toggle extracted OUTSIDE Automations so it is not re-created on every
// parent render. A component defined inside another component's function body gets
// a new identity on every render, which destroys and re-creates the DOM node.
const AutomationToggle = ({ auto, businessId, onToggle }) => {
  const [status, setStatus] = React.useState(auto.status);
  const handleClick = async () => {
    // Fix #25: align with backend which toggles between 'active' and 'disabled'
    const newStatus = status === 'active' ? 'disabled' : 'active';
    if (!DEMO_IDS.includes(businessId)) {
      try { await AtlasAPI.automations.toggle(businessId, auto.id); } catch { /* silent */ }
    }
    setStatus(newStatus);
    if (onToggle) onToggle(auto.id, newStatus);
  };
  return (
    <button
      className={`btn btn-sm ${status === 'active' ? 'btn-success' : ''}`}
      onClick={handleClick}
    >
      {status === 'active' ? 'Active' : 'Disabled'}
    </button>
  );
};

export const Automations = ({ business }) => {
  const [autos, setAutos] = React.useState([]);
  const [suggested, setSuggested] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(null); // track which suggested automation is being added

  React.useEffect(() => {
    if (!business?.id) { setLoading(false); return; }

    // Fix #7: Load demo automations from business prop instead of early-returning
    if (DEMO_IDS.includes(business.id) || business.isDemo) {
      setAutos(business.automations || []);
      setSuggested(business.suggestedAutomations || []);
      setLoading(false);
      return;
    }

    Promise.all([
      AtlasAPI.automations.list(business.id),
      AtlasAPI.automations.suggested(business.id)
    ]).then(([list, sugg]) => {
      setAutos(list || []);
      setSuggested(sugg || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [business?.id, business?.automations, business?.suggestedAutomations, business?.isDemo]);

  const handleAddSuggested = async (sugg, index) => {
    setAdding(index);
    try {
      if (DEMO_IDS.includes(business.id) || business.isDemo) {
        // Demo: optimistically add to autos list
        setAutos(prev => [...prev, { ...sugg, id: `demo-${Date.now()}`, status: 'active', action: sugg.action }]);
        setSuggested(prev => prev.filter((_, i) => i !== index));
        return;
      }
      const created = await AtlasAPI.automations.create(business.id, { trigger: sugg.trigger, action: sugg.action });
      setAutos(prev => [...prev, created]);
      setSuggested(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to add automation', err);
    } finally {
      setAdding(null);
    }
  };

  // (toggleAuto handler moved to AutomationToggle above)

  if (loading) return <div style={{ padding: 64 }}><SkeletonLine style={{ width: 200 }} /></div>;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Autopilot" title="Automations" subtitle="Rules that run automatically."/>
      <div style={{ display: 'grid', gap: 24 }}>
        {autos.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active ({autos.length})</div>
            <div className="card" style={{ padding: 18 }}>
              {autos.map(auto => (
                <div key={auto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{auto.trigger}</div>
                    {/* Fix #36: demo data uses .action not .actionType */}
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{auto.actionType || auto.action}</div>
                  </div>
                  <AutomationToggle auto={auto} businessId={business.id} />
                </div>
              ))}
            </div>
          </div>
        )}
        {suggested.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Suggested ({suggested.length})</div>
            <div className="card" style={{ padding: 18 }}>
              {suggested.map((sugg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: i === suggested.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div>
                    {/* Fix #37: demo suggestedAutomations have no .title, use .trigger as fallback */}
                    <div style={{ fontWeight: 500 }}>{sugg.title || sugg.trigger}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{sugg.trigger} → {sugg.action}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddSuggested(sugg, i)} disabled={adding === i}>
                    {adding === i ? 'Adding…' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Reports = ({ business }) => {
  const [reports, setReports] = React.useState([]);
  const [generating, setGenerating] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!business?.id || DEMO_IDS.includes(business.id)) return;
    AtlasAPI.reports.list(business.id).then(setReports).catch(console.error);
  }, [business?.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage('');
    try {
      if (DEMO_IDS.includes(business?.id)) {
        await new Promise(r => setTimeout(r, 1200));
        const demoReport = { id: `demo-${Date.now()}`, name: 'Weekly performance brief', type: 'weekly', createdAt: new Date().toISOString(), status: 'ready' };
        setReports(prev => [demoReport, ...prev]);
        setMessage('✓ Report generated successfully');
      } else {
        const report = await AtlasAPI.reports.create(business.id, 'weekly');
        setReports(prev => [report, ...prev]);
        setMessage('✓ Report generated successfully');
      }
    } catch (err) {
      setMessage(`✗ Error: ${err.message}`);
    } finally {
      setGenerating(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const downloadReport = (reportId) => {
    if (reportId.startsWith('demo-')) {
      alert('PDF generation is simulated for demo reports.');
      return;
    }
    const url = AtlasAPI.reports.downloadUrl(business.id, reportId);
    window.open(url, '_blank');
  };

  if (!business) return <div style={{ padding: 64 }}>Select a business.</div>;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Intelligence" title="Reports" subtitle="Export data-backed business briefs."/>
      
      <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
        <Icon name="file-text" size={32} color="var(--ink-4)" style={{ marginBottom: 16 }}/>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Weekly performance brief</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Get a comprehensive PDF summary of your revenue, insights, and recommended actions for the past 7 days.
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate report'}
        </button>
        {message && <div style={{ marginTop: 16, fontSize: 13, color: message.includes('✓') ? 'var(--positive)' : 'var(--negative)' }}>{message}</div>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>History</div>
      <div className="card">
        {reports.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>No reports generated yet.</div>
        ) : (
          reports.map((r, i) => (
            <div key={r.id} style={{ padding: 16, borderBottom: i === reports.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="file" size={16} color="var(--ink-3)"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <button className="btn btn-sm" onClick={() => downloadReport(r.id)}>
                <Icon name="download" size={13} style={{ marginRight: 6 }}/> Download PDF
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const Settings = ({ business, onRefresh }) => {
  // Fix #35: debounce API updates — was firing on every keystroke
  const debounceRef = React.useRef({});
  const debouncedUpdate = (field, value) => {
    clearTimeout(debounceRef.current[field]);
    debounceRef.current[field] = setTimeout(async () => {
      try {
        await AtlasAPI.businesses.update(business.id, { [field]: value });
        onRefresh();
      } catch (err) { console.error('Settings update failed', err); }
    }, 500);
  };
  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <SectionHeader eyebrow="Workspace" title="Settings" />
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Business info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           <div>
             <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>Name</label>
             <input className="input" defaultValue={business.name || ''} onChange={(e) => debouncedUpdate('name', e.target.value)} />
           </div>
           <div>
             <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>Category</label>
             <input className="input" defaultValue={business.category || ''} onChange={(e) => debouncedUpdate('category', e.target.value)} />
           </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-3)' }}>Address</label>
            <input className="input" defaultValue={business.location || business.address || ''} onChange={(e) => debouncedUpdate('location', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main tabbed component
export const Pages = ({ business, onRefresh, initialTab }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab || 'analytics');
  
  React.useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, activeTab]);

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
