import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI } from './api';

// Atlas — Other dashboard pages: Analytics, Sources, Automations, Reports, Settings

export const Analytics = ({ business }) => {
  const [range, setRange] = React.useState('6M');
  const [cat, setCat] = React.useState('All');
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Revenue</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>{fmtINR(business.metrics.revenue.value)} <Delta value={business.metrics.revenue.delta}/></div>
          <LineChart data={business.revenueSeries} height={220} accent="var(--ink-1)"/>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>{business.customerGrowth[business.customerGrowth.length-1].v.toLocaleString('en-IN')}</div>
          <LineChart data={business.customerGrowth} height={220} accent="#1e40af"/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Orders by day</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>{business.ordersSeries.reduce((s, d) => s + d.v, 0).toLocaleString('en-IN')} <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>this week</span></div>
          <BarChart data={business.ordersSeries} height={220} accent="var(--ink-1)"/>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>Top movers</div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Item</th>
                <th style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Units</th>
                <th style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontWeight: 500 }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {(business.topMovers || []).map(([name, u, d], i, arr) => (
                <tr key={i}>
                  <td style={{ padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>{name}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', fontFamily: 'var(--font-mono)', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>{u}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}><Delta value={d}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const DataSources = ({ business }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const [processing, setProcessing] = React.useState(null);
  const [uploadJobs, setUploadJobs] = React.useState([]);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;

    AtlasAPI.uploads.list(business.id)
      .then((jobs) => {
        if (!cancelled) setUploadJobs(jobs);
      })
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
    { name: 'Shopify', kind: 'integration', status: 'available', last: 'Connect to enable', icon: 'database', mock: true },
  ];

  const simulateUpload = (message = 'Extracting structure…') => {
    setProcessing(message);
    setTimeout(() => setProcessing('Normalizing data…'), 1200);
    setTimeout(() => setProcessing('Linking to existing records…'), 2400);
    setTimeout(() => setProcessing(null), 3600);
  };

  const pollUpload = async (uploadId) => {
    for (let i = 0; i < 30; i += 1) {
      const status = await AtlasAPI.uploads.status(business.id, uploadId);
      setUploadJobs(prev => [status, ...prev.filter(job => job.id !== status.id)]);
      setProcessing(`${status.stage}…`);

      if (status.status === 'complete') {
        setProcessing('Data ready');
        setTimeout(() => setProcessing(null), 900);
        return;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    throw new Error('Upload still processing. Check again shortly.');
  };

  const uploadFile = async (file) => {
    if (!file) {
      simulateUpload();
      return;
    }

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
    const file = files?.[0];
    uploadFile(file);
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
            <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['PDF', 'CSV', 'PNG / JPG', 'XLSX'].map(t => (
                <span key={t} className="badge" style={{ fontSize: 10 }}>{t}</span>
              ))}
            </div>
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
            {s.status === 'parsed' && <span className="badge badge-info"><Icon name="check" size={10} strokeWidth={2.5}/> Parsed</span>}
            {s.status === 'available' ? (
              <button className="btn btn-sm">Connect</button>
            ) : (
              <button className="btn btn-ghost btn-sm"><Icon name="more" size={14}/></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Automations = ({ business }) => {
  const [autos, setAutos] = React.useState(business.automations);
  const toggle = (id) => setAutos(autos.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Run on autopilot"
        title="Automations"
        subtitle="Rules that run when conditions are met. Atlas drafts the action; you keep control."
        action={<button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> New automation</button>}
      />

      {/* Active */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Your automations · {autos.filter(a => a.status === 'active').length} active</div>
        <div className="card" style={{ padding: 0 }}>
          {autos.map((a, i) => (
            <div key={a.id} style={{ padding: '16px 18px', borderBottom: i === autos.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>WHEN</span>
                    <span style={{ fontWeight: 500 }}>{a.trigger}</span>
                  </div>
                  <Icon name="arrow-right" size={12} color="var(--ink-4)"/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>DO</span>
                    <span style={{ fontWeight: 500 }}>{a.action}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Last triggered: {a.last}</div>
              </div>
              <button onClick={() => toggle(a.id)} style={{
                width: 36, height: 20, borderRadius: 999,
                background: a.status === 'active' ? 'var(--ink-1)' : 'var(--border-strong)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 140ms',
              }}>
                <span style={{ position: 'absolute', top: 2, left: a.status === 'active' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 140ms', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}/>
              </button>
              <button className="btn btn-ghost btn-sm"><Icon name="more" size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Suggested by Atlas · based on your data</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {business.suggestedAutomations.map((s, i) => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Icon name="sparkles" size={13}/>
                <span className="eyebrow">SUGGESTION</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>WHEN</span>
                <span style={{ fontWeight: 500, marginLeft: 8 }}>{s.trigger}</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 14 }}>
                <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>DO</span>
                <span style={{ fontWeight: 500, marginLeft: 8 }}>{s.action}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Enable</button>
                <button className="btn btn-sm">Customize</button>
                <button className="btn btn-ghost btn-sm"><Icon name="x" size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Reports = ({ business }) => {
  const reports = [
    { name: 'Weekly performance brief', desc: 'Last 7 days · executive summary + 3 actions', date: 'May 1, 2026', size: '4 pages' },
    { name: 'Monthly financial review', desc: 'April 2026 · revenue, COGS, margin, runway', date: 'Apr 30, 2026', size: '12 pages' },
    { name: 'Customer cohort analysis', desc: 'Q1 2026 · retention, LTV, channel mix', date: 'Apr 8, 2026', size: '8 pages' },
    { name: 'Inventory audit', desc: 'Stock levels, aging, reorder forecast', date: 'Apr 1, 2026', size: '6 pages' },
  ];
  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Documents"
        title="Reports"
        subtitle="Exportable summaries. Generate on demand or on a schedule."
        action={<button className="btn btn-primary btn-sm"><Icon name="plus" size={13}/> Generate report</button>}
      />

      <div className="card" style={{ padding: 18, marginBottom: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="sparkles" size={18}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>This week's brief is ready</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>3 risks identified · 4 actions recommended · est. 6 min read</div>
          </div>
          <button className="btn btn-sm"><Icon name="download" size={13}/> Download PDF</button>
          <button className="btn btn-primary btn-sm">View brief</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ padding: '16px 18px', borderBottom: i === reports.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="file" size={15} color="var(--ink-2)"/>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r.desc}</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.date}</span>
            <span className="badge">{r.size}</span>
            <button className="btn btn-sm"><Icon name="download" size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Settings = ({ business }) => {
  const goals = [
    { id: 'rev', label: 'Increase revenue', on: true },
    { id: 'csat', label: 'Improve customer satisfaction', on: false },
    { id: 'inv', label: 'Optimize inventory', on: true },
    { id: 'delays', label: 'Reduce delays', on: false },
    { id: 'repeat', label: 'Increase repeat customers', on: true },
  ];
  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <SectionHeader eyebrow="Workspace" title="Settings" subtitle="Workspace, goals, and data preferences."/>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Business info</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Name</label>
            <input className="input" defaultValue={business.name}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Type</label>
            <input className="input" defaultValue={business.type}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Location</label>
            <input className="input" defaultValue={business.location}/>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Optimization goals</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>Active goals shape Atlas's recommendations.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goals.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13 }}>{g.label}</span>
              <button style={{ width: 36, height: 20, borderRadius: 999, background: g.on ? 'var(--ink-1)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 2, left: g.on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white' }}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Data preferences</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>How Atlas processes and retains your data.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 500 }}>Anonymize for model training</div><div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Use aggregated patterns, no raw data.</div></div>
            <button style={{ width: 36, height: 20, borderRadius: 999, background: 'var(--ink-1)', border: 'none', position: 'relative' }}><span style={{ position: 'absolute', top: 2, left: 18, width: 16, height: 16, borderRadius: '50%', background: 'white' }}/></button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 500 }}>Retain raw uploads</div><div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Keep original files for 90 days for audit.</div></div>
            <button style={{ width: 36, height: 20, borderRadius: 999, background: 'var(--border-strong)', border: 'none', position: 'relative' }}><span style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: '50%', background: 'white' }}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};
