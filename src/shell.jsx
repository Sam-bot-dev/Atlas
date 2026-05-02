import React from 'react';
import { BizAvatar, Icon } from './ui';
import { ATLAS_BUSINESS_LIST, ATLAS_BUSINESSES } from './data';
import { AtlasAPI } from './api';

// Atlas — Dashboard shell + sidebar + topbar

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'sources', label: 'Data sources', icon: 'database' },
  { id: 'automations', label: 'Automations', icon: 'zap' },
  { id: 'reports', label: 'Reports', icon: 'file' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const Sidebar = ({ active, onChange, business, onSwitch, onExit }) => {
  return (
    <aside style={{
      width: 224, flexShrink: 0,
      borderRight: '1px solid var(--border-subtle)',
      background: 'var(--bg-tinted)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '16px 16px 12px' }}>
        <button onClick={onSwitch} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 8px',
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 6, cursor: 'pointer',
          transition: 'background 120ms',
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <BizAvatar business={business} size={26}/>
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{business.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{business.type}</div>
          </div>
          <Icon name="chevron-down" size={14} color="var(--ink-3)"/>
        </button>
      </div>

      <div style={{ padding: '0 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div className="eyebrow" style={{ padding: '12px 8px 6px', fontSize: 10 }}>Workspace</div>
        {SIDEBAR_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px',
              border: 'none', background: isActive ? 'var(--bg-elevated)' : 'transparent',
              boxShadow: isActive ? 'var(--shadow-xs), 0 0 0 1px var(--border)' : 'none',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 13,
              color: isActive ? 'var(--ink-1)' : 'var(--ink-2)',
              fontWeight: isActive ? 500 : 400,
              transition: 'all 120ms',
              textAlign: 'left',
            }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={item.icon} size={15} color={isActive ? 'var(--ink-1)' : 'var(--ink-3)'}/>
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <div className="card" style={{ padding: 12, background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            <Icon name="sparkles" size={13}/>
            Atlas Pro trial
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>9 days remaining</div>
          <button className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Upgrade</button>
        </div>
        <button onClick={onExit} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 8, color: 'var(--ink-3)' }}>
          <Icon name="logout" size={13}/> Log out
        </button>
      </div>
    </aside>
  );
};

export const TopBar = ({ title, business, user, onSwitch, query, setQuery, onAsk }) => {
  const [open, setOpen] = React.useState(false);
  const [askOpen, setAskOpen] = React.useState(false);
  const userName = user?.name || business.owner || 'Owner';
  const initials = userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AT';
  return (
    <div style={{
      height: 56, padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--topbar-bg)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-3)' }}>
        <span>{business.name}</span>
        <Icon name="chevron-right" size={12} color="var(--ink-4)"/>
        <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-sm" style={{ background: 'var(--bg-tinted)', border: '1px solid var(--border-subtle)', color: 'var(--ink-3)' }} onClick={() => setAskOpen(true)}>
          <Icon name="sparkles" size={13}/>
          Ask Atlas…
          <span className="mono" style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 10, marginLeft: 8 }}>⌘K</span>
        </button>
        <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
          <Icon name="bell" size={15}/>
          <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: 'var(--negative)' }}/>
        </button>
        <div style={{ width: 1, height: 22, background: 'var(--border)' }}/>
        <button onClick={() => setOpen(!open)} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 999, cursor: 'pointer', position: 'relative',
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #d6d3d1, #78716c)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{initials}</div>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{userName}</span>
          <Icon name="chevron-down" size={12} color="var(--ink-3)"/>
        </button>
      </div>

      {askOpen && <AskAtlas onClose={() => setAskOpen(false)} business={business}/>}
    </div>
  );
};

const AskAtlas = ({ onClose, business }) => {
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState(null);

  const samplesByType = {
    'Home Baker': ['Why was last Saturday slower?', 'What should I do about cinnamon roll margins?', 'Show me my best customers'],
    'Retail Shop': ['Why did foot traffic drop Thursday?', 'Which SKUs should I mark down?', 'What is my busiest hour this week?'],
    'Pharmacy': ['Why is Monday wait time higher?', 'Which refills are most at risk of lapsing?', 'What is driving front-of-store growth?'],
    'Cafe': ['Why is cold brew growing so fast?', 'How do I reduce oat milk cost?', 'Who are my top loyalty members?'],
    'Import/Export': ['Why is on-time rate dropping?', 'Which clients are at churn risk?', 'What is the FX impact this quarter?'],
    'Service Business': ['Why did revenue jump in March?', 'Which jobs have the best margin?', 'When should I hire another crew member?'],
  };
  const samples = samplesByType[business.type] || samplesByType['Home Baker'];

  const handleAsk = (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer(null);
    AtlasAPI.ask(business.id, query)
      .then(r => { setLoading(false); setAnswer(r.answer || r.text || 'Response received.'); })
      .catch(e => { setLoading(false); setAnswer('Error generating reasoning insight. Please try again.'); });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.30)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={onClose}>
      <div className="card fade-in" style={{ width: 560, padding: 0, boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkles" size={16}/>
          <input
            autoFocus className="input"
            style={{ border: 'none', padding: 0, fontSize: 14, flex: 1 }}
            placeholder={`Ask anything about ${business.name}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(q)}
          />
          {loading
            ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink-1)', animation: 'spin 600ms linear infinite', flexShrink: 0 }}/>
            : <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>esc</span>
          }
        </div>
        {answer && (
          <div className="fade-in" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, background: 'var(--bg-subtle)' }}>
            {answer}
          </div>
        )}
        <div style={{ padding: 8 }}>
          <div className="eyebrow" style={{ padding: '8px 10px' }}>Suggested</div>
          {samples.map((s, i) => (
            <div key={i} style={{ padding: '8px 10px', fontSize: 13, color: 'var(--ink-2)', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setQ(s); handleAsk(s); }}
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

// Business switcher modal
export const BusinessSwitcher = ({ current, allBusinessList, allBusinesses, onSelect, onClose }) => {
  const list = allBusinessList || ATLAS_BUSINESS_LIST;
  const businesses = allBusinesses || ATLAS_BUSINESSES;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.30)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="card fade-in" style={{ width: 480, padding: 20, boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Switch business</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Each demo loads its own dataset.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflow: 'auto' }}>
          {list.map(b => {
            const biz = businesses[b.id] || businesses['baker'];
            const isCurrent = current.id === b.id;
            return (
              <button key={b.id} onClick={() => { onSelect(b.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 10, borderRadius: 6,
                border: 'none', background: isCurrent ? 'var(--bg-subtle)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
              }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
              >
                <BizAvatar business={biz} size={32}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{biz.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{biz.type} · {biz.location}</div>
                </div>
                {isCurrent && <Icon name="check" size={14} color="var(--ink-1)"/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
