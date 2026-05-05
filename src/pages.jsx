import React, { useEffect, useState } from 'react';
import { Automations } from './Automations';
import { Tasks } from './Tasks';
import { Records } from './Records';
import { AtlasAPI, logError } from './api';
import { LineChart } from './charts';
import { Icon } from './ui';

const Section = ({ title, children, action }) => (
  <div style={{ marginBottom: 24, borderRadius: 16, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {action}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const SummaryCard = ({ label, value, suffix = '', delta }) => (
  <div style={{ flex: 1, minWidth: 160, padding: 18, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink-1)' }}>{value}{suffix}</div>
    {delta != null && <div style={{ marginTop: 6, color: delta >= 0 ? 'var(--positive)' : 'var(--negative)', fontSize: 13 }}>{delta >= 0 ? '+' : ''}{delta}%</div>}
  </div>
);

const LoadingScreen = () => (
  <div style={{ padding: 64, textAlign: 'center', color: 'var(--ink-3)' }}>Loading…</div>
);

const AnalyticsPage = ({ business }) => {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    let active = true;
    setLoading(true);

    Promise.all([
      AtlasAPI.metrics.summary(business.id).catch((error) => {
        logError('Analytics summary', error);
        return null;
      }),
      AtlasAPI.metrics.series(business.id, 'revenue').catch((error) => {
        logError('Analytics series', error);
        return [];
      }),
      AtlasAPI.metrics.peakHours(business.id).catch((error) => {
        logError('Analytics peakHours', error);
        return null;
      }),
    ]).then(([summaryRes, revenueRes, peakHoursRes]) => {
      if (!active) return;
      setSummary(summaryRes || null);
      setSeries(Array.isArray(revenueRes?.series) ? revenueRes.series : revenueRes || []);
      setLoading(false);
    });

    return () => { active = false; };
  }, [business?.id]);

  const metrics = summary?.metrics || business?.metrics || {};
  const metricCards = [
    { label: 'Revenue', value: metrics.revenue?.value ?? '—', suffix: metrics.revenue?.unit || '', delta: metrics.revenue?.delta },
    { label: 'Orders', value: metrics.orders?.value ?? '—', suffix: metrics.orders?.unit || '', delta: metrics.orders?.delta },
    { label: 'Conversion', value: metrics.conversion?.value ?? '—', suffix: metrics.conversion?.unit || '', delta: metrics.conversion?.delta },
    { label: 'Inventory', value: metrics.inventory?.value ?? '—', suffix: metrics.inventory?.unit || '', delta: metrics.inventory?.delta },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ padding: 20, display: 'grid', gap: 24 }}>
      <Section title="Analytics Overview" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {metricCards.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>
      <Section title="Revenue Trend" action={null}>
        <LineChart data={series} />
      </Section>
      <Section title="Business Pulse">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280, padding: 20, borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg)' }}>
            <strong>Business</strong>
            <div>{business.name}</div>
            <div style={{ color: 'var(--ink-3)', marginTop: 4 }}>{business.category || 'Unknown category'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 280, padding: 20, borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg)' }}>
            <strong>Location</strong>
            <div>{business.location || business.address || 'No location available'}</div>
          </div>
        </div>
      </Section>
    </div>
  );
};

const SourcesPage = ({ business }) => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('upload');
  const [name, setName] = useState('Upload files');
  const [saving, setSaving] = useState(false);

  const loadSources = () => {
    if (!business?.id) return;
    setLoading(true);
    AtlasAPI.sources.list(business.id)
      .then(setSources)
      .catch((error) => {
        logError('Sources list', error);
        setSources([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSources();
  }, [business?.id]);

  const handleCreate = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      await AtlasAPI.sources.connect(business.id, type, { credentials: true });
      setName('Upload files');
      setType('upload');
      loadSources();
    } catch (error) {
      logError('Create source', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (sourceId) => {
    if (!business?.id) return;
    try {
      await AtlasAPI.sources.sync(business.id, sourceId);
      loadSources();
    } catch (error) {
      logError('Sync source', error);
    }
  };

  const handleDelete = async (sourceId) => {
    if (!business?.id) return;
    try {
      await AtlasAPI.sources.disconnect(business.id, sourceId);
      loadSources();
    } catch (error) {
      logError('Delete source', error);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ padding: 20, display: 'grid', gap: 24 }}>
      <Section title="Data Sources" action={<button className="btn btn-primary btn-sm" onClick={loadSources}><Icon name="refresh" size={14}/> Refresh</button>}>
        <p style={{ margin: 0 }}>Connect your raw data sources so Atlas can ingest and analyze your business automatically.</p>
      </Section>

      <Section title="Connected sources">
        {sources.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ margin: 0, color: 'var(--ink-3)' }}>No sources are connected yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sources.map((source) => (
              <div key={source.id} style={{ padding: 18, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{source.name || source.type}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{source.type} · {source.status}</div>
                  {source.meta?.lastSyncAt && <div style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 6 }}>Last synced: {new Date(source.meta.lastSyncAt).toLocaleString()}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleSync(source.id)}>Sync</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(source.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Add source">
        <div style={{ display: 'grid', gap: 12, maxWidth: 460 }}>
          <label style={{ display: 'grid', gap: 6, color: 'var(--ink-3)' }}>
            Source type
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="upload" className="input" />
          </label>
          <label style={{ display: 'grid', gap: 6, color: 'var(--ink-3)' }}>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Upload files" className="input" />
          </label>
          <button className="btn btn-primary" disabled={saving} onClick={handleCreate}>Add source</button>
        </div>
      </Section>
    </div>
  );
};

const ReportsPage = ({ business }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadReports = () => {
    if (!business?.id) return;
    setLoading(true);
    AtlasAPI.reports.list(business.id)
      .then(setReports)
      .catch((error) => {
        logError('Reports list', error);
        setReports([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [business?.id]);

  const createReport = async (type) => {
    if (!business?.id) return;
    setCreating(true);
    try {
      await AtlasAPI.reports.create(business.id, type);
      loadReports();
    } catch (error) {
      logError('Create report', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ padding: 20, display: 'grid', gap: 24 }}>
      <Section title="Reports" action={<button className="btn btn-primary btn-sm" onClick={() => createReport('weekly')} disabled={creating}>Generate weekly report</button>}>
        <p style={{ margin: 0 }}>Your reports are generated on demand and can be downloaded as PDF summaries of your business health.</p>
      </Section>
      <Section title="Available reports">
        {reports.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ margin: 0, color: 'var(--ink-3)' }}>No reports generated yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {reports.map((report) => (
              <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: 18, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{report.name}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{report.type} · {new Date(report.createdAt).toLocaleDateString()}</div>
                </div>
                <a className="btn btn-ghost btn-sm" href={AtlasAPI.reports.downloadUrl(business.id, report.id)}>Download PDF</a>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const SettingsPage = ({ business }) => {
  const [form, setForm] = useState({
    name: business?.name || '',
    category: business?.category || '',
    location: business?.location || business?.address || '',
    owner: business?.owner || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      name: business?.name || '',
      category: business?.category || '',
      location: business?.location || business?.address || '',
      owner: business?.owner || '',
    });
  }, [business?.id]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!business?.id) return;
    setSaving(true);
    setMessage('');
    try {
      await AtlasAPI.businesses.update(business.id, {
        name: form.name,
        category: form.category,
        location: form.location,
      });
      setMessage('Saved successfully');
    } catch (error) {
      logError('Settings update', error);
      setMessage('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20, display: 'grid', gap: 24 }}>
      <Section title="Business settings">
        <p style={{ margin: 0 }}>Update your business profile and contact details here.</p>
      </Section>
      <Section title="Profile">
        <div style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          {['name', 'category', 'location', 'owner'].map((field) => (
            <label key={field} style={{ display: 'grid', gap: 6, color: 'var(--ink-3)' }}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
              <input
                className="input"
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </label>
          ))}
          <button className="btn btn-primary" disabled={saving} onClick={save}>Save changes</button>
          {message && <div style={{ color: message.includes('Unable') ? 'var(--negative)' : 'var(--positive)' }}>{message}</div>}
        </div>
      </Section>
    </div>
  );
};

export function Pages({ business, onRefresh, initialTab }) {
  if (!business) {
    return <LoadingScreen />;
  }

  switch (initialTab) {
    case 'overview':
      return <div style={{ padding: 20 }}>Select Overview from the left menu.</div>;
    case 'analytics':
      return <AnalyticsPage business={business} />;
    case 'sources':
      return <SourcesPage business={business} />;
    case 'automations':
      return <Automations business={business} />;
    case 'reports':
      return <ReportsPage business={business} />;
    case 'settings':
      return <SettingsPage business={business} />;
    case 'tasks':
      return <Tasks business={business} />;
    case 'records':
      return <Records business={business} />;
    default:
      return (
        <div style={{ padding: 20 }}>
          <h1>Page Not Found</h1>
          <p>The page "{initialTab}" is not available.</p>
        </div>
      );
  }
}
