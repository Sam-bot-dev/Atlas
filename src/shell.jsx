import React from 'react';
import { BizAvatar, Icon } from './ui';
import { ATLAS_BUSINESS_LIST } from './data';
import { AtlasAPI } from './api';

// Atlas — Dashboard shell + sidebar + topbar

const SIDEBAR_ITEMS = [
  { id: 'overview',    label: 'Overview',      icon: 'home'         },
  { id: 'analytics',  label: 'Analytics',     icon: 'chart'        },
  { id: 'sources',    label: 'Data sources',  icon: 'database'     },
  { id: 'records',    label: 'Records',       icon: 'archive'      },
  { id: 'tasks',      label: 'Tasks',         icon: 'check-square' },
  { id: 'automations',label: 'Automations',   icon: 'zap'          },
  { id: 'reports',    label: 'Reports',       icon: 'file'         },
  { id: 'settings',   label: 'Settings',      icon: 'settings'     },
];

export const Sidebar = ({ active, onChange, business, onSwitch, onExit, isDemo, onUpgrade, user = null }) => {
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
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{business?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{business?.category}</div>
            {isDemo && <span className="badge" style={{ fontSize: 10 }}>Demo</span>}
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
            {user?.subscription?.status === 'active' ? 'Pro trial' : 'Atlas Pro trial'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>
            {user?.subscription?.status === 'active'
              ? 'Active until ' + (user.subscription.current_period_end ? new Date(user.subscription.current_period_end).toLocaleDateString() : 'soon')
              : 'Trial active'}
          </div>
          <button className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onUpgrade}>
            {user?.subscription?.status === 'active' ? 'Manage' : 'Upgrade'}
          </button>
        </div>
        <button onClick={onExit} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 8, color: 'var(--ink-3)' }}>
          <Icon name="logout" size={13}/> Log out
        </button>
      </div>
    </aside>
  );
};

// Demo notifications — contextual per business so the bell has real content
const DEMO_NOTIFICATIONS = {
  baker:    [{ message: "3 new orders — 2 custom cakes, 1 hamper", time: "2m ago" }, { message: "Ingredient alert: butter below 5-day threshold", time: "1h ago" }, { message: "New 5★ review: 'Best birthday cake in Pune!'", time: "3h ago" }],
  retail:   [{ message: "B2B reorder due: Riya Boutique (22-day cadence)", time: "30m ago" }, { message: "18 polyester SKUs flagged for markdown", time: "2h ago" }, { message: "Revenue 20% below forecast — offer drafted", time: "4h ago" }],
  pharmacy: [{ message: "14 refill reminders sent via WhatsApp", time: "1h ago" }, { message: "Schedule H stock: Alprazolam below reorder", time: "3h ago" }, { message: "Monsoon stock PO auto-generated for review", time: "Yesterday" }],
  cafe:     [{ message: "Loyalty voucher sent to 8 inactive members", time: "45m ago" }, { message: "Daily milk: 23L — standing order updated", time: "6h ago" }, { message: "New Swiggy review (3★) — reply drafted", time: "Yesterday" }],
  trade:    [{ message: "Shipment #SH-2847 delayed 52h — client notified", time: "1h ago" }, { message: "USD/INR moved 1.8% — hedging alert ready", time: "3h ago" }, { message: "GST filing due in 5 days — accounts notified", time: "Yesterday" }],
  service:  [{ message: "Quote follow-up sent to 3 leads (7-day cadence)", time: "2h ago" }, { message: "Project #P-14 complete — review request sent", time: "4h ago" }, { message: "Crew at 94% — hiring alert triggered", time: "Yesterday" }],
};

// ── Shared modal wrapper ──────────────────────────────────────────────────────
const SimpleModal = ({ title, icon, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
    <div className="card fade-in" style={{ width: '100%', maxWidth: 440, padding: 28, background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name={icon} size={16}/>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onClose}><Icon name="x" size={15}/></button>
      </div>
      {children}
    </div>
  </div>
);

// ── Profile modal ─────────────────────────────────────────────────────────────
const ProfileModal = ({ user, onClose, onNameUpdate }) => {
  const [name, setName] = React.useState(user?.name || '');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { AtlasAPI } = await import('./api');
      await AtlasAPI.auth.updateName(name.trim());
      // Update session cache
      try {
        const cached = sessionStorage.getItem('atlas-user');
        if (cached) {
          const u = JSON.parse(cached);
          sessionStorage.setItem('atlas-user', JSON.stringify({ ...u, name: name.trim() }));
        }
      } catch { /* ignore */ }
      onNameUpdate(name.trim());
      setMsg('Saved!');
    } catch (e) {
      setMsg('Failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SimpleModal title="Profile" icon="user" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Display name</label>
          <input
            className="input"
            value={name}
            onChange={e => { setName(e.target.value); setMsg(''); }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Your name"
            autoFocus
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Email</label>
          <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}/>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>Email cannot be changed</div>
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.startsWith('Failed') ? 'var(--negative)' : 'var(--positive)', fontWeight: 500 }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};

// ── Help modal ────────────────────────────────────────────────────────────────
const HelpModal = ({ onClose, onExit }) => {
  const [deleting, setDeleting] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const { AtlasAPI } = await import('./api');
      await AtlasAPI.auth.deleteAccount();
      sessionStorage.clear();
      if (onExit) onExit();
    } catch (e) {
      alert('Failed to delete account: ' + e.message);
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <SimpleModal title="Help & Support" icon="help-circle" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Documentation', desc: 'Guides and feature walkthroughs', href: '#' },
          { label: 'Contact support', desc: 'Email us at support@atlas.ai', href: 'mailto:support@atlas.ai' },
          { label: 'Report a bug', desc: 'Something not working right?', href: 'mailto:support@atlas.ai?subject=Bug report' },
        ].map(item => (
          <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{item.desc}</div>
            </div>
            <Icon name="arrow-right" size={13} color="var(--ink-4)"/>
          </a>
        ))}

        <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8 }}>Danger zone</div>
          {confirm ? (
            <div style={{ padding: 14, borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>Are you sure? This cannot be undone.</div>
              <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 12 }}>All your businesses, records, and data will be permanently deleted.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white', border: 'none' }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="trash" size={13} color="#dc2626"/> Delete my account
            </button>
          )}
        </div>
      </div>
    </SimpleModal>
  );
};

export const TopBar = ({ title, business, user, onExit = null, onOpenChat }) => {
  const [open, setOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [modal, setModal] = React.useState(null);
  const userName = user?.name || business?.owner || 'Owner';
  const initials = userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AT';

  const notifications = user?.notifications?.length
    ? user.notifications
    : (DEMO_NOTIFICATIONS[business?.id] || []);

  // ⌘K opens the main chatbot
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenChat) onOpenChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenChat]);

  return (
    <div style={{
      height: 56, padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--topbar-bg)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-3)' }}>
        <span>{business?.name}</span>
        <Icon name="chevron-right" size={12} color="var(--ink-4)"/>
        <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }} onClick={() => setNotifOpen(p => !p)}>
            <Icon name="bell" size={15}/>
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: 'var(--negative)' }}/>
            )}
          </button>
          {notifOpen && (
            <div
              style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, minWidth: 280, maxWidth: 320, boxShadow: 'var(--shadow-lg)', zIndex: 20 }}
              onMouseLeave={() => setNotifOpen(false)}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Notifications</div>
              {notifications.length === 0 ? (
                <div style={{ padding: '16px 12px', fontSize: 13, color: 'var(--ink-4)', textAlign: 'center' }}>You're all caught up.</div>
              ) : notifications.slice(0, 5).map((n, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 6, cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>{n.message || n.title || String(n)}</div>
                  {n.time && <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{n.time}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

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

      {open && (
        <div
          style={{ position: 'absolute', top: 56, right: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, minWidth: 180, boxShadow: 'var(--shadow-lg)', zIndex: 20 }}
          onMouseLeave={() => setOpen(false)}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{user?.email || ''}</div>
          </div>
          {[{ label: 'Profile', icon: 'user' }, { label: 'Billing', icon: 'credit-card' }, { label: 'Help', icon: 'help-circle' }].map(item => (
            <button key={item.label}
              onClick={() => { setOpen(false); setModal(item.label.toLowerCase()); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name={item.icon} size={13} color="var(--ink-3)"/> {item.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 4 }}>
            {typeof onExit === 'function' && (
              <button onClick={() => { setOpen(false); onExit(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', fontSize: 13, cursor: 'pointer', borderRadius: 6, color: 'var(--negative)', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon name="logout" size={13}/> Log out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile modal */}
      {modal === 'profile' && (
        <ProfileModal user={user} onClose={() => setModal(null)} onNameUpdate={(name) => {
          // Bubble up via a custom event so App.jsx can update currentUser
          window.dispatchEvent(new CustomEvent('atlas:nameUpdated', { detail: { name } }));
          setModal(null);
        }}/>
      )}

      {/* Billing modal */}
      {modal === 'billing' && (
        <SimpleModal title="Billing" icon="credit-card" onClose={() => setModal(null)}>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4 }}>Current plan</div>
              <div style={{ fontWeight: 600 }}>Atlas Pro Trial</div>
            </div>
            <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--ink-3)' }}>
              Billing management is coming soon. You're on a free trial — no charges yet.
            </div>
          </div>
        </SimpleModal>
      )}

      {/* Help modal */}
      {modal === 'help' && (
        <HelpModal onClose={() => setModal(null)} onExit={onExit}/>
      )}
    </div>
  );
};

// Business switcher modal
export const BusinessSwitcher = ({ current, allBusinessList, onSelect, onClose }) => {
  const [search, setSearch] = React.useState('');
  const list = (allBusinessList || ATLAS_BUSINESS_LIST).filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.30)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="card fade-in" style={{ width: 480, padding: 0, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Switch business</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {(allBusinessList || ATLAS_BUSINESS_LIST).length === 0 ? 'No businesses yet' : `${(allBusinessList || ATLAS_BUSINESS_LIST).length} business${(allBusinessList || ATLAS_BUSINESS_LIST).length !== 1 ? 'es' : ''}`}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ink-4)' }}>
              <Icon name="search" size={14}/>
            </div>
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13 }}
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflow: 'auto', padding: 12 }}>
          {list.map(biz => {
            const isActive = biz.id === current?.id;
            return (
              <button key={biz.id} onClick={() => { onSelect(biz.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                border: '1px solid', borderColor: isActive ? 'var(--ink-1)' : 'transparent',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 120ms',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <BizAvatar business={biz} size={32}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{biz.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{biz.category} • {biz.location || biz.address}</div>
                </div>
                {biz.isDemo && <span className="badge" style={{ fontSize: 10 }}>Demo</span>}
                {isActive && <Icon name="check" size={14} color="var(--ink-1)"/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
