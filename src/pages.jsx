import React from 'react';
import { Icon, Delta, fmtINR, SectionHeader, SkeletonLine, SkeletonChart, SkeletonTableRow } from './ui';
import { LineChart, BarChart } from './charts';
import { AtlasAPI } from './api';

// Tabbed dashboard pages
const AnalyticsTab = ({ business: initialBusiness }) => {
  const safeBusiness = initialBusiness?.id ? initialBusiness : null;
  const [range, setRange] = React.useState('6M');
  const [cat, setCat] = React.useState('All');
  const [metrics, setMetrics] = React.useState(initialBusiness?.metrics || {});
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
      setImportMessage(`✓ Successfully updated metrics for ${result.totalUpdated || 0} business(es)`);
      setTimeout(() => setImportMessage(''), 2000);
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
    link.click();
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
          {loading ? <SkeletonChart /> : <LineChart data={initialBusiness.revenueSeries || []} />}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Customer growth</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, marginBottom: 12 }}>
            {loading ? <SkeletonLine /> : (initialBusiness.customerGrowth || [])[0]?.v || '0'}
          </div>
          {loading ? <SkeletonChart /> : <LineChart data={initialBusiness.customerGrowth || []} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Orders by day</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 12 }}>
            {loading ? <SkeletonLine /> : ((initialBusiness.ordersSeries || []).reduce((s, d) => s + (d.v || 0), 0) || 0)}
          </div>
          {loading ? <SkeletonChart /> : <BarChart data={initialBusiness.ordersSeries || []} />}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Top movers</div>
          {loading ? <SkeletonLine /> : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {(initialBusiness.topMovers || []).slice(0, 5).map(([name, u, d], i) => (
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

const DataSourcesTab = ({ business }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const [processing, setProcessing] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const sources = [
    { name: 'Square POS', status: 'connected', last: 'Synced 4 min ago', icon: 'database' },
    { name: 'Google Business', status: 'connected', last: 'Synced 1 hour ago', icon: 'globe' },
    { name: 'Instagram', status: 'connected', last: 'Synced 12 min ago', icon: 'image' },
    { name: 'Inventory system', status: 'available', last: 'Connect', icon: 'package' },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setProcessing('Processing...');
  };

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader eyebrow="Inputs" title="Data sources" subtitle="Connect sources for insights." />
      <div 
        className="card"
        onDragOver={(e) => e.preventDefault() || setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ padding: 28, border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer', marginBottom: 24 }}
      >
        {processing ? (
          <div>Processing file...</div>
        ) : (
          <>
            <Icon name="upload" size={20} />
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>Drop files here</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>PDF, CSV, screenshots</div>
          </>
        )}
      </div>
      <div className="card">
        {sources.map((s, i) => (
          <div key={i} style={{ padding: 16, borderBottom: i === sources.length - 1 ? 'none' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name={s.icon} size={16} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.last}</div>
              </div>
              <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-positive)', borderRadius: 4 }}>Connected</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationsTab = ({ business }) => (
  <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
    <SectionHeader eyebrow="Autopilot" title="Automations" subtitle="Rules that run automatically." />
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>No automations configured.</div>
      <button className="btn btn-primary" style={{ marginTop: 16 }}>
        <Icon name="plus" /> Add automation
      </button>
    </div>
  </div>
);

const ReportsTab = ({ business }) => (
  <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
    <SectionHeader title="Reports" subtitle="AI-generated summaries." />
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>No reports yet.</div>
      <button className="btn btn-primary" style={{ marginTop: 16 }}>
        Generate report
      </button>
    </div>
  </div>
);

const SettingsTab = ({ business }) => (
  <div style={{ padding: '32px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
    <SectionHeader eyebrow="Workspace" title="Settings" />
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Business info</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><label style={{ fontSize: 12, color: 'var(--ink-3)' }}>Name</label><input className="input" value={business.name} disabled /></div>
        <div><label style={{ fontSize: 12, color: 'var(--ink-3)' }}>Type</label><input className="input" value={business.type} disabled /></div>
      </div>
    </div>
  </div>
);

// Main tabbed component
export const Pages = ({ business, onRefresh }) => {
  const [activeTab, setActiveTab] = React.useState('analytics');
  const tabs = [
    { id: 'analytics', label: 'Analytics', component: AnalyticsTab },
    { id: 'data', label: 'Data Sources', component: DataSourcesTab },
    { id: 'automations', label: 'Automations', component: AutomationsTab },
    { id: 'reports', label: 'Reports', component: ReportsTab },
    { id: 'settings', label: 'Settings', component: SettingsTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AnalyticsTab;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Tab nav */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '0 32px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--ink-1)' : 'var(--ink-3)',
              borderBottom: activeTab === tab.id ? '2px solid var(--ink-1)' : 'none',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ActiveComponent business={business} onRefresh={onRefresh} />
    </div>
  );
};

