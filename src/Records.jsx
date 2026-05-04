import React from 'react';
import { Icon, SectionHeader, fmtINR } from './ui';
import { AtlasAPI, logError } from './api';

const TABS = [
  { id: 'orders',    label: 'Orders',    icon: 'shopping-bag' },
  { id: 'customers', label: 'Customers', icon: 'users'        },
  { id: 'products',  label: 'Products',  icon: 'package'      },
  { id: 'reviews',   label: 'Reviews',   icon: 'star'         },
  { id: 'inventory', label: 'Inventory', icon: 'archive'      },
];

// ── AI Search Modal ───────────────────────────────────────────────────────────
const AiSearchModal = ({ business, records, onClose }) => {
  const [query, setQuery] = React.useState('');
  const [answer, setAnswer] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef();

  React.useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = async (q) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      // Build a compact data summary to send as context
      const summary = {
        orders: records.orders.slice(0, 50).map(o => ({ date: o.orderDate, customer: o.customerName, product: o.productName, total: o.total, channel: o.channel })),
        customers: records.customers.slice(0, 50).map(c => ({ name: c.name, orders: c.ordersCount, spend: c.totalSpend, segment: c.segment })),
        products: records.products.slice(0, 30).map(p => ({ name: p.name, sold: p.unitsSold, revenue: p.revenue, stock: p.quantityOnHand })),
        reviews: records.reviews.slice(0, 30).map(r => ({ rating: r.rating, sentiment: r.sentiment, body: r.body?.slice(0, 100) })),
        inventory: records.inventory.slice(0, 30).map(i => ({ item: i.itemName, qty: i.quantityOnHand, reorder: i.reorderPoint, status: i.status })),
      };
      const res = await AtlasAPI.insights.askWithContext(q, { ...business, _recordsSummary: summary });
      setAnswer(res.answer);
    } catch (e) {
      setAnswer('Could not reach AI. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Who are my top 3 customers by spend?',
    'Which products are running low on stock?',
    'What was my best selling day?',
    'Show me all negative reviews',
    'Which channel brings the most orders?',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }} onClick={onClose}>
      <div className="card fade-in" style={{ width: 560, padding: 0, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkles" size={16} color="var(--ink-1)"/>
          <input
            ref={inputRef}
            className="input"
            style={{ border: 'none', padding: 0, fontSize: 14, flex: 1 }}
            placeholder="Ask anything about your records…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(query)}
          />
          {loading
            ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink-1)', animation: 'spin 600ms linear infinite', flexShrink: 0 }}/>
            : <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>esc</span>
          }
        </div>

        {/* Answer */}
        {answer && (
          <div className="fade-in" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, background: 'var(--bg-subtle)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
            {answer}
          </div>
        )}

        {/* Suggestions */}
        <div style={{ padding: 8 }}>
          <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested</div>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{ padding: '8px 10px', fontSize: 13, color: 'var(--ink-2)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setQuery(s); ask(s); }}
            >
              <Icon name="arrow-right" size={12} color="var(--ink-4)"/>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EditableCell = ({ value, onSave, type = 'text' }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value ?? '');
  const ref = React.useRef();

  React.useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = type === 'number' ? parseFloat(val) || 0 : val;
    if (parsed !== value) onSave(parsed);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type={type === 'number' ? 'number' : 'text'}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false); } }}
        style={{ width: '100%', border: '1px solid var(--ink-1)', borderRadius: 4, padding: '2px 6px', fontSize: 12, background: 'var(--bg-elevated)', outline: 'none' }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ cursor: 'text', display: 'block', minWidth: 40, padding: '2px 4px', borderRadius: 4, transition: 'background 100ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {value ?? '—'}
    </span>
  );
};

const fmt = (v) => v != null && v !== '' ? v : '—';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

export const Records = ({ business }) => {
  const [tab, setTab] = React.useState('orders');
  const [records, setRecords] = React.useState({ orders: [], customers: [], products: [], reviews: [], inventory: [] });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [showAiSearch, setShowAiSearch] = React.useState(false);

  const isDemo = ['baker','retail','pharmacy','cafe','trade','service'].includes(business?.id) || business?.isDemo;

  const load = React.useCallback(async () => {
    if (!business?.id || isDemo) { setLoading(false); return; }
    try {
      const data = await AtlasAPI.records.list(business.id);
      setRecords(data);
    } catch (e) { logError('Records load', e); }
    finally { setLoading(false); }
  }, [business?.id, isDemo]);

  React.useEffect(() => { load(); }, [load]);

  const handleUpdate = async (type, id, field, value) => {
    setSaving(id);
    try {
      const updated = await AtlasAPI.records.update(business.id, type, id, { [field]: value });
      setRecords(prev => ({
        ...prev,
        [type]: prev[type].map(r => r.id === id ? { ...r, ...updated } : r),
      }));
    } catch (e) { logError('Record update', e); }
    finally { setSaving(null); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Delete this record? This will affect your metrics.')) return;
    try {
      await AtlasAPI.records.delete(business.id, type, id);
      setRecords(prev => ({ ...prev, [type]: prev[type].filter(r => r.id !== id) }));
    } catch (e) { logError('Record delete', e); }
  };

  const rows = (records[tab] || []).filter(r => {
    if (!search) return true;
    return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
  });

  const totalCounts = Object.entries(records).reduce((acc, [k, v]) => ({ ...acc, [k]: v.length }), {});

  if (loading) {
    return (
      <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <SectionHeader eyebrow="Data" title="Records" subtitle="All your business data in one place."/>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }}/>)}
      </div>
    );
  }

  if (isDemo) {
    return (
      <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <SectionHeader eyebrow="Data" title="Records" subtitle="All your business data in one place."/>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="archive" size={32} color="var(--ink-4)"/>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 16, marginBottom: 8 }}>Records are for real businesses</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 360, margin: '0 auto' }}>
            Create your own business account to start storing and editing records from uploads and AI chat.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1320, margin: '0 auto' }}>
      <SectionHeader
        eyebrow="Data"
        title="Records"
        subtitle="Everything Atlas knows about your business. Edit any cell — metrics update automatically."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setShowAiSearch(true)}>
              <Icon name="sparkles" size={13}/> Ask AI
            </button>
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={13} color="var(--ink-4)" style={{ position: 'absolute', left: 10, top: 9 }}/>
              <input
                className="input"
                style={{ paddingLeft: 30, fontSize: 12, width: 200 }}
                placeholder="Search records…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />
      {showAiSearch && <AiSearchModal business={business} records={records} onClose={() => setShowAiSearch(false)}/>}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', border: 'none', background: 'transparent',
              borderBottom: tab === t.id ? '2px solid var(--ink-1)' : '2px solid transparent',
              color: tab === t.id ? 'var(--ink-1)' : 'var(--ink-3)',
              fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <Icon name={t.icon} size={13}/>
            {t.label}
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--ink-4)', fontWeight: 500 }}>
              {totalCounts[t.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Icon name={TABS.find(t => t.id === tab)?.icon || 'archive'} size={28} color="var(--ink-4)"/>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12, color: 'var(--ink-2)' }}>
            {search ? `No ${tab} matching "${search}"` : `No ${tab} yet`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 6 }}>
            Upload a file or chat with Atlas in Data Sources to add records.
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {tab === 'orders' && ['Date','Customer','Product','Qty','Price','Total','Channel'].map(h => <Th key={h}>{h}</Th>)}
                {tab === 'customers' && ['Name','Phone','Email','Orders','Total Spend','Segment'].map(h => <Th key={h}>{h}</Th>)}
                {tab === 'products' && ['Name','SKU','Category','Units Sold','Revenue','Stock','Reorder At'].map(h => <Th key={h}>{h}</Th>)}
                {tab === 'reviews' && ['Date','Platform','Rating','Sentiment','Review'].map(h => <Th key={h}>{h}</Th>)}
                {tab === 'inventory' && ['Item','SKU','On Hand','Reorder Point','Status'].map(h => <Th key={h}>{h}</Th>)}
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: saving === r.id ? 0.5 : 1 }}>
                  {tab === 'orders' && <>
                    <Td>{fmtDate(r.orderDate)}</Td>
                    <Td><EditableCell value={r.customerName} onSave={v => handleUpdate('orders', r.id, 'customerName', v)}/></Td>
                    <Td><EditableCell value={r.productName} onSave={v => handleUpdate('orders', r.id, 'productName', v)}/></Td>
                    <Td><EditableCell value={r.quantity} type="number" onSave={v => handleUpdate('orders', r.id, 'quantity', v)}/></Td>
                    <Td><EditableCell value={r.unitPrice} type="number" onSave={v => handleUpdate('orders', r.id, 'unitPrice', v)}/></Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtINR(r.total)}</Td>
                    <Td><EditableCell value={r.channel} onSave={v => handleUpdate('orders', r.id, 'channel', v)}/></Td>
                  </>}
                  {tab === 'customers' && <>
                    <Td><EditableCell value={r.name} onSave={v => handleUpdate('customers', r.id, 'name', v)}/></Td>
                    <Td><EditableCell value={r.phone} onSave={v => handleUpdate('customers', r.id, 'phone', v)}/></Td>
                    <Td><EditableCell value={r.email} onSave={v => handleUpdate('customers', r.id, 'email', v)}/></Td>
                    <Td>{fmt(r.ordersCount)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtINR(r.totalSpend)}</Td>
                    <Td><EditableCell value={r.segment} onSave={v => handleUpdate('customers', r.id, 'segment', v)}/></Td>
                  </>}
                  {tab === 'products' && <>
                    <Td><EditableCell value={r.name} onSave={v => handleUpdate('products', r.id, 'name', v)}/></Td>
                    <Td>{fmt(r.sku)}</Td>
                    <Td><EditableCell value={r.category} onSave={v => handleUpdate('products', r.id, 'category', v)}/></Td>
                    <Td>{fmt(r.unitsSold)}</Td>
                    <Td style={{ fontFamily: 'var(--font-mono)' }}>{fmtINR(r.revenue)}</Td>
                    <Td><EditableCell value={r.quantityOnHand} type="number" onSave={v => handleUpdate('products', r.id, 'quantityOnHand', v)}/></Td>
                    <Td><EditableCell value={r.reorderPoint} type="number" onSave={v => handleUpdate('products', r.id, 'reorderPoint', v)}/></Td>
                  </>}
                  {tab === 'reviews' && <>
                    <Td>{fmtDate(r.reviewDate || r.createdAt)}</Td>
                    <Td>{fmt(r.platform)}</Td>
                    <Td>
                      <span style={{ color: r.rating >= 4 ? 'var(--positive)' : r.rating <= 2 ? 'var(--negative)' : 'var(--warning)', fontWeight: 600 }}>
                        {'★'.repeat(Math.round(r.rating || 0))} {r.rating || '—'}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, fontWeight: 500,
                        background: r.sentiment === 'positive' ? '#dcfce7' : r.sentiment === 'negative' ? '#fee2e2' : 'var(--bg-subtle)',
                        color: r.sentiment === 'positive' ? '#166534' : r.sentiment === 'negative' ? '#991b1b' : 'var(--ink-3)',
                      }}>
                        {r.sentiment || 'neutral'}
                      </span>
                    </Td>
                    <Td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt(r.body)}</Td>
                  </>}
                  {tab === 'inventory' && <>
                    <Td><EditableCell value={r.itemName} onSave={v => handleUpdate('inventory', r.id, 'itemName', v)}/></Td>
                    <Td>{fmt(r.sku)}</Td>
                    <Td><EditableCell value={r.quantityOnHand} type="number" onSave={v => handleUpdate('inventory', r.id, 'quantityOnHand', v)}/></Td>
                    <Td><EditableCell value={r.reorderPoint} type="number" onSave={v => handleUpdate('inventory', r.id, 'reorderPoint', v)}/></Td>
                    <Td>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, fontWeight: 500,
                        background: r.status === 'ok' ? '#dcfce7' : r.status === 'out' ? '#fee2e2' : '#fef3c7',
                        color: r.status === 'ok' ? '#166534' : r.status === 'out' ? '#991b1b' : '#92400e',
                      }}>
                        {r.status || 'ok'}
                      </span>
                    </Td>
                  </>}
                  <Td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', color: 'var(--negative)' }}
                      onClick={() => handleDelete(tab, r.id)}
                      title="Delete record"
                    >
                      <Icon name="trash" size={12}/>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-4)' }}>
        Click any cell to edit. Changes update your metrics and insights automatically.
      </div>
    </div>
  );
};

const Th = ({ children }) => (
  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const Td = ({ children, style }) => (
  <td style={{ padding: '8px 12px', color: 'var(--ink-2)', verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);
