import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader, SkeletonLine, SkeletonCircle, SkeletonChart, SkeletonTableRow } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI } from './api';

// Atlas — Other dashboard pages: Analytics, Sources, Automations, Reports, Settings

export const Analytics = ({ business: initialBusiness }) => {
  const safeBusiness = initialBusiness?.id ? initialBusiness : null;
  const [range, setRange] = React.useState('6M');
  const [cat, setCat] = React.useState('All');
  const [metrics, setMetrics] = React.useState(initialBusiness.metrics || {});
  const [loading, setLoading] = React.useState(false);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState('');
  const fileInputRef = React.useRef(null);

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
      setImportMessage(`✓ Successfully updated metrics for ${result.totalUpdated} business(es)`);
      setTimeout(() => {
        setImportMessage('');
        setLoading(true);
        AtlasAPI.metrics.summary(safeBusiness.id, range)
          .then(res => { if (res && Object.keys(res).length > 0) setMetrics(res); })
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 2000);
    } catch (error) {
      setImportMessage(`✗ Error: ${error.message || 'Failed to import metrics'}`);
      setTimeout(() => setImportMessage(''), 3000);
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/metrics-template.csv';
    link.download = 'metrics-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fallbackMetric = { value: 0, delta: 0, label: 'No data', unit: '', period: '' };
  const revenue = metrics.revenue || initialBusiness.metrics?.revenue || fallbackMetric;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      {safeBusiness ? (
        <>
          <SectionHeader
        eyebrow="Trends"
        title="Analytics"
        subtitle="Cross-source trends with applied filters."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              {['7D', '1M', '3M', '6M', '1Y'].map(p => (
                <button key={p} onClick={() => setRange(p)} style={{ padding: '4px 10px', border: 'none', borderRadius: 4, background: range === p ? 'var(--bg-elevated)' : 'transparent', boxShadow: range === p ? 'var(--shadow-xs)' : 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', color: range === p ? 'var(--ink-1)' : 'var(--ink-3)' }}>{p}</button>
              ))}
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="input" style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}>
              <option>All categories</option>
            </select>
            <button className="btn btn-sm"><Icon name="download" size={13}/> Export</button>
          </div>
        }
      />


      {/* Excel Import Section */}
      <div className="card" style={{ padding: 18, marginBottom: 12, background: 'linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-elevated) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', marginBottom: 4 }}>
              <Icon name="upload" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Import Metrics from Excel
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              Upload an Excel or CSV file to update revenue, growth, orders, and customer data for all businesses
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="btn btn-sm"
              style={{ opacity: importLoading ? 0.6 : 1 }}
            >
              <Icon name="upload" size={12}/>
              {importLoading ? 'Importing...' : 'Upload Excel'}
            </button>
            <button 
              onClick={downloadTemplate}
              className="btn btn-sm"
              style={{ background: 'var(--bg-elevated)', color: 'var(--ink-2)' }}
            >
              <Icon name="download" size={12}/>
              Template
            </button>
          </div>
        </div>
        {importMessage && (
          <div style={{ marginTop: 12, padding: 8, fontSize: 12, borderRadius: 4, background: importMessage.includes('✓') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: importMessage.includes('✓') ? '#22c55e' : '#ef4444', border: `1px solid ${importMessage.includes('✓') ? '#22c55e' : '#ef4444'}` }}>
            {importMessage}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleImportExcel(e.target.files[0]);
            }
          }}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Revenue card */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12, minHeight: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading
              ? <SkeletonLine width="50%" height={24} />
              : <>{fmtINR(revenue.value)} <Delta value={revenue.delta}/></>
            }
          </div>
          {loading
            ? <SkeletonChart height={220} />
            : <LineChart data={initialBusiness.revenueSeries} height={220} accent="var(--ink-1)"/>
          }
        </div>

        {/* Customer growth card */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12, minHeight: 32, display: 'flex', alignItems: 'center' }}>
            {loading
              ? <SkeletonLine width="45%" height={24} />
              : (initialBusiness.customerGrowth || []).length > 0
                ? initialBusiness.customerGrowth[initialBusiness.customerGrowth.length - 1].v.toLocaleString('en-IN')
                : '0'
            }
          </div>
          {loading
            ? <SkeletonChart height={220} />
            : <LineChart data={initialBusiness.customerGrowth || []} height={220} accent="#1e40af"/>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Orders by day */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Orders by day</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12, minHeight: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading
              ? <SkeletonLine width="40%" height={24} />
              : <>{(initialBusiness.ordersSeries || []).reduce((s, d) => s + d.v, 0).toLocaleString('en-IN')} <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>this week</span></>
            }
          </div>
          {loading
            ? <SkeletonChart height={220} />
            : <BarChart data={initialBusiness.ordersSeries || []} height={220} accent="var(--ink-1)"/>
          }
        </div>

        {/* Top movers */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>Top movers</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* header shimmer */}
              <div style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                <SkeletonLine width="40%" height={10} />
                <SkeletonLine width="20%" height={10} style={{ marginLeft: 'auto' }} />
                <SkeletonLine width="15%" height={10} />
              </div>
              {[0,1,2,3,4].map(i => (
                <SkeletonTableRow key={i} cols={['45%', '20%', '15%']} last={i === 4} />
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Item</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Units</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {(initialBusiness.topMovers || []).map(([name, u, d], i, arr) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>{name}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontFamily: 'var(--font-mono)', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>{u}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}><Delta value={d}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

        )}
        : (
          <div style={{ padding: '64px 32px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12, color: 'var(--ink-2)' }}>Select a business</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32, lineHeight: 1.5 }}>
              Choose a business from the sidebar to view analytics. Demo businesses are pre-loaded with sample data.
            </div>
            <div style={{ opacity: 0.5, fontSize: 12, color: 'var(--ink-4)' }}>
              No API calls made until business selected.
            </div>
          </div>
        )}
      )}
    </div>
  );
};

export const DataSources = ({ business, onRefresh }) => {


export const DataSources = ({ business, onRefresh }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const [processing, setProcessing] = React.useState(null);
  const [uploadJobs, setUploadJobs] = React.useState([]);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    AtlasAPI.uploads.list(business.id)
      .then((jobs) => { if (!cancelled && jobs) setUploadJobs(jobs); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [business.id]);

  const sources = [
    ...(business.dataSources || []).map(ds => ({
      name: ds.name,
      kind: ds.type,
      status: ds.status === 'complete' ? 'connected' : ds.status === 'processing' ? 'parsed' : 'available',
      last: `Added ${new Date(ds.createdAt).toLocaleDateString()}`,
      icon: ds.type.includes('google') ? 'globe' : ds.type.includes('pos') ? 'database' : 'file',
    })),
    ...uploadJobs.map(job => ({
      name: job.fileName,
      kind: job.detectedType,
      status: job.status === 'complete' ? 'connected' : job.status === 'failed' ? 'available' : 'parsed',
      last: job.status === 'failed' ? job.error || 'Processing failed' : `${job.stage} · ${job.detectedType.toUpperCase()}`,
      icon: job.detectedType === 'image' ? 'image' : 'file',
    })),
    { name: 'Square POS', kind: 'integration', status: 'connected', last: 'Synced 4 min ago', icon: 'database', mock: true },
    { name: 'Google Business', kind: 'integration', status: 'connected', last: 'Synced 1 hour ago', icon: 'globe' },
    { name: 'Instagram', kind: 'integration', status: 'connected', last: 'Synced 12 min ago', icon: 'image', mock: true },
    { name: 'Inventory system', kind: 'integration', status: 'available', last: 'Connect to enable', icon: 'package', mock: true },
  ];

  const simulateUpload = (message = 'Extracting structure…') => {
    setProcessing(message);
    setTimeout(() => setProcessing('Normalizing data…'), 1200);
    setTimeout(() => setProcessing('Linking to existing records…'), 2400);
    setTimeout(() => setProcessing(null), 3600);
  };

  const pollUpload = async (uploadId) => {
    for (let i = 0; i < 30; i++) {
      const status = await AtlasAPI.uploads.status(business.id, uploadId);
      setUploadJobs(prev => [status, ...prev.filter(job => job.id !== status.id)]);
      setProcessing(`${status.stage}…`);
      if (status.status === 'complete') {
        setProcessing('Data ready');
        if (onRefresh) onRefresh();
        setTimeout(() => setProcessing(null), 900);
        return;
      }
      if (status.status === 'failed') throw new Error(status.error || 'Processing failed');
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    throw new Error('Upload still processing. Check again shortly.');
  };

  const uploadFile = async (file) => {
    if (!file) { simulateUpload(); return; }
    setProcessing('Extracting structure…');
    try {
      const accepted = await AtlasAPI.uploads.upload(business.id, file);
      setProcessing(`${accepted.stage}…`);
      await pollUpload(accepted.uploadId);
    } catch (error) {
      simulateUpload(error.status === 401 ? 'Login required for live upload. Showing demo flow…' : (error.message || 'Upload failed. Showing demo flow…'));
    }
  };

  const handleFiles = (files) => {
    uploadFile(files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Inputs"
        title="Data sources"
        subtitle="Atlas reads what you connect. Add more for sharper insights."
        action={<button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Connect source</button>}
      />

      {/* Upload zone */}
      <div
        className="card"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: 28, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer', marginBottom: 24,
          borderColor: dragOver ? 'var(--ink-1)' : 'var(--border-strong)',
          background: dragOver ? 'var(--bg-subtle)' : 'var(--bg-elevated)',
          transition: 'all 140ms ease',
        }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.json,.txt,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        {processing ? (
          <>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink-1)', margin: '0 auto 12px', animation: 'spin 600ms linear infinite' }}/>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{processing}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>Atlas is reading your file…</div>
          </>
        ) : (
          <>
            <Icon name="upload" size={20} color={dragOver ? 'var(--ink-1)' : 'var(--ink-3)'}/>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>{dragOver ? 'Release to upload' : 'Drop files to upload'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>PDFs, CSVs, screenshots — Atlas extracts structured data automatically.</div>
          </>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Connected & available</div>
          <span className="badge"><span className="dot dot-positive"/> {sources.filter(s => s.status !== 'available').length} active</span>
        </div>
        {sources.map((s, i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: i === sources.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={15} color="var(--ink-2)"/>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.name}
                {s.mock && <span className="badge" style={{ fontSize: 10 }}>mock</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{s.last}</div>
            </div>
            {s.status === 'connected' && <span className="badge badge-positive"><span className="dot dot-positive"/> Connected</span>}
            {s.status === 'available'
              ? <button className="btn btn-sm">Connect</button>
              : <button className="btn btn-ghost btn-sm"><Icon name="more" size={14}/></button>
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export const Automations = ({ business }) => {
  const [autos, setAutos] = React.useState([]);
  const [suggested, setSuggested] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!business.id || ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      setAutos(business.automations || []);
      return;
    }
    setLoading(true);
    Promise.all([
      AtlasAPI.automations.list(business.id),
      AtlasAPI.automations.suggested(business.id),
    ]).then(([activeList, suggestedList]) => {
      setAutos(activeList || []);
      setSuggested(suggestedList || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [business.id]);

  const toggle = async (id) => {
    if (['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      setAutos(autos.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));
      return;
    }
    try {
      const updated = await AtlasAPI.automations.toggle(business.id, id);
      setAutos(autos.map(a => a.id === id ? updated : a));
    } catch (e) {
      alert('Failed to toggle automation: ' + e.message);
    }
  };

  const enableSuggested = async (s) => {
    try {
      const created = await AtlasAPI.automations.create(business.id, { trigger: s.trigger, action: s.action });
      setAutos([...autos, created]);
      setSuggested(suggested.filter(x => x.trigger !== s.trigger));
    } catch (e) {
      alert('Failed to enable automation: ' + e.message);
    }
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader 
        eyebrow="Run on autopilot" 
        title="Automations" 
        subtitle="Rules that run when conditions are met."
        action={
          <>
            <input type="file" id="json-upload" accept=".json" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const json = JSON.parse(event.target.result);
                    const created = await AtlasAPI.automations.create(business.id, { trigger: json.trigger || 'uploaded_json', action: json.action || 'upload JSON' });
                    setAutos([...autos, created]);
                  } catch (err) { alert('Failed to read or upload JSON automation'); }
                };
                reader.readAsText(file);
              }
            }}/>
            <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('json-upload').click()}>
              <Icon name="plus" size={13}/> Add automation
            </button>
          </>
        }
      />

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--ink-2)' }}>Active Automations</div>
      <div className="card" style={{ padding: 0, marginBottom: 32, overflow: 'hidden' }}>
        {loading ? (
          // Skeleton rows — same structure as real rows
          [0, 1, 2].map(i => (
            <div key={i} style={{ padding: '16px 18px', borderBottom: i === 2 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* WHEN → DO row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SkeletonLine width={36} height={10} />
                  <SkeletonLine width={100} height={13} />
                  <SkeletonLine width={16} height={10} />
                  <SkeletonLine width={28} height={10} />
                  <SkeletonLine width={110} height={13} />
                </div>
                {/* last run line */}
                <SkeletonLine width="35%" height={10} />
              </div>
              <SkeletonLine width={72} height={30} radius={6} />
            </div>
          ))
        ) : (
          <>
            {autos.map((a, i) => (
              <div key={a.id} style={{ padding: '16px 18px', borderBottom: i === autos.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>WHEN</span>
                    <span style={{ fontWeight: 500 }}>{a.trigger}</span>
                    <Icon name="arrow-right" size={12}/>
                    <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>DO</span>
                    <span style={{ fontWeight: 500 }}>{a.action}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Last run: {a.lastRunAt ? new Date(a.lastRunAt).toLocaleString() : 'Never'}</div>
                </div>
                <button onClick={() => toggle(a.id)} className={`btn btn-sm ${a.status === 'active' ? 'btn-positive' : 'btn-ghost'}`}>
                  {a.status === 'active' ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
            {autos.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>No active automations.</div>
            )}
          </>
        )}
      </div>

      {suggested.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--ink-2)' }}>Suggested for your business type</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {suggested.map((s, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>{s.trigger}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>{s.action}</div>
                <button onClick={() => enableSuggested(s)} className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Enable</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Reports = ({ business }) => {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!business.id || ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      setReports([
        { id: 'rep-1', name: 'Weekly performance brief', desc: 'Last 7 days · executive summary + 3 actions', date: 'May 1, 2026', size: '4 pages' },
      ]);
      return;
    }
    setLoading(true);
    AtlasAPI.reports.list(business.id)
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [business.id]);

  const download = (r) => {
    if (['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      alert('Reports are available for registered businesses. Generating demo PDF...');
      return;
    }
    window.open(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/businesses/${business.id}/reports/${r.id}/download`, '_blank');
  };

  const generate = async () => {
    setLoading(true);
    try {
      const newRep = await AtlasAPI.reports.generate(business.id, 'weekly');
      setReports(prev => [newRep, ...prev]);
    } catch (e) {
      alert('Failed to generate report: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        title="Reports"
        subtitle="Exportable summaries generated by Atlas AI."
        action={<button className="btn btn-primary btn-sm" onClick={generate} disabled={loading}><Icon name="plus" size={13}/> Generate latest</button>}
      />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ padding: '16px 18px', borderBottom: i === 2 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* file icon placeholder */}
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0 }}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonLine width="55%" height={13} />
                <SkeletonLine width="35%" height={10} />
              </div>
              <SkeletonLine width={36} height={30} radius={6} />
            </div>
          ))
        ) : (
          <>
            {reports.map((r, i) => (
              <div key={r.id || i} style={{ padding: '16px 18px', borderBottom: i === reports.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="file" size={15} color="var(--ink-2)"/>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r.desc || `${new Date(r.createdAt).toLocaleDateString()} · ${r.type}`}</div>
                </div>
                <button className="btn btn-sm" onClick={() => download(r)}><Icon name="download" size={13}/></button>
              </div>
            ))}
            {reports.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>No reports found. Click generate to create one.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const Settings = ({ business }) => {
  const [goals, setGoals] = React.useState(business.goals || []);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      setLoading(true);
      AtlasAPI.settings.get(business.id)
        .then(data => { if (data && data.goals) setGoals(data.goals); })
        .finally(() => setLoading(false));
    }
  }, [business.id]);

  const goalOptions = [
    { id: 'rev',    label: 'Increase revenue' },
    { id: 'csat',   label: 'Improve customer satisfaction' },
    { id: 'inv',    label: 'Optimize inventory' },
    { id: 'delays', label: 'Reduce delays' },
    { id: 'repeat', label: 'Increase repeat customers' },
  ];

  const toggleGoal = (id) => setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);

  const save = async () => {
    if (['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(business.id)) {
      alert('Settings persistence is available for registered businesses.');
      return;
    }
    setSaving(true);
    try {
      await AtlasAPI.settings.updateGoals(business.id, goals);
      alert('Goals updated successfully!');
    } catch (e) {
      alert('Failed to update goals: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <SectionHeader eyebrow="Workspace" title="Settings" subtitle="Workspace, goals, and data preferences."/>

      {/* Business info card */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Business info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            [0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonLine width="20%" height={10} />
                <SkeletonLine width="100%" height={38} radius={6} />
              </div>
            ))
          ) : (
            <>
              <div><label className="eyebrow">Name</label><input className="input" defaultValue={business.name} disabled/></div>
              <div><label className="eyebrow">Type</label><input className="input" defaultValue={business.type} disabled/></div>
              <div><label className="eyebrow">Address</label><input className="input" defaultValue={business.address} disabled/></div>
            </>
          )}
        </div>
      </div>

      {/* Goals card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Business goals</div>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [0, 1, 2, 3, 4].map(i => (
              <SkeletonLine key={i} width="100%" height={44} radius={8} />
            ))
          ) : (
            goalOptions.map(g => {
              const sel = goals.includes(g.id);
              return (
                <button key={g.id} className="card" style={{
                  padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: sel ? '1px solid var(--ink-1)' : '1px solid var(--border)',
                  background: sel ? 'var(--bg-subtle)' : 'var(--bg-elevated)',
                }} onClick={() => toggleGoal(g.id)}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</span>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: sel ? '1px solid var(--ink-1)' : '1px solid var(--border-strong)', background: sel ? 'var(--ink-1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <Icon name="check" size={10} strokeWidth={2.5} color="white"/>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
