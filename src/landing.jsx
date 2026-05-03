// Atlas — Landing page

import React from 'react';
import { ATLAS_BUSINESS_LIST, ATLAS_BUSINESSES } from './data';
import { AtlasLogo, Icon, BizAvatar } from './ui';

export const Landing = ({ onDemo, onLogin, onSignup, onNavigate = () => {} }) => {
  const list = ATLAS_BUSINESS_LIST;
  return (
    <div className="brand-glow" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AtlasLogo/>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
            <a href="#product" style={{ cursor: 'pointer' }}>Product</a>
            <a href="#demo" style={{ cursor: 'pointer' }}>Demo businesses</a>
            <a onClick={() => onNavigate('pricing')} style={{ cursor: 'pointer' }}>Pricing</a>
            <a onClick={() => onNavigate('docs')} style={{ cursor: 'pointer' }}>Docs</a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onLogin}>Log in</button>
            <button className="btn btn-primary" onClick={onSignup}>Get started</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 32, transition: 'transform 0.2s ease', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span className="dot dot-positive pulse-live"></span>
          <span>New — multi-source insight engine in v2.4</span>
          <Icon name="arrow-right" size={12}/>
        </div>
        <h1 style={{ fontSize: 72, lineHeight: 1.05, letterSpacing: '-0.035em', fontWeight: 600, margin: '0 0 24px', color: 'var(--ink-1)' }}>
          Decide what to do next,<br/> <span className="serif text-gradient" style={{ fontStyle: 'italic', fontWeight: 400 }}>with absolute confidence</span>.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 640, margin: '0 auto 40px' }}>
          Atlas reads your sales, inventory, reviews and ops data, then tells you what's happening, why, and the highest-leverage move you can make this week.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => onDemo('baker')}>
            Try a live demo
            <Icon name="arrow-right" size={14}/>
          </button>
          <button className="btn btn-lg" onClick={onLogin}>
            Log in
          </button>
        </div>
        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--ink-3)' }}>
          No signup needed for demos · <span style={{ fontFamily: 'mono', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>demo@atlas.ai / atlas123</span> · Connect real data in 2 minutes
        </div>
      </div>

      {/* Social proof strip */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { value: '6', label: 'business types covered' },
            { value: '80+', label: 'data integrations' },
            { value: '< 2 min', label: 'to first insight' },
            { value: '100%', label: 'grounded in your data' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>{s.value}</span>
              <span style={{ color: 'var(--ink-3)' }}>{s.label}</span>
              {i < 3 && <span style={{ width: 1, height: 16, background: 'var(--border)', marginLeft: 16 }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Three pillars */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { num: '01', q: 'What is happening', body: 'Real-time view of revenue, orders, inventory, sentiment — across every system you connect.', icon: 'chart' },
            { num: '02', q: 'Why it is happening', body: 'Atlas correlates events across your data to surface the root cause behind every trend.', icon: 'lightbulb' },
            { num: '03', q: 'What to do next', body: 'Prioritized actions with projected impact, effort, and confidence — ready to one-click apply.', icon: 'zap' },
          ].map((p, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', padding: 28 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 14 }}>{p.num}</div>
              <Icon name={p.icon} size={20} className="" />
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 14, marginBottom: 8, letterSpacing: '-0.01em' }}>{p.q}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo grid */}
      <div id="demo" className="brand-grid" style={{ maxWidth: '100%', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', margin: '60px auto 0', padding: '80px 0', background: 'var(--bg-tinted)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--brand)' }}>Live Sandbox</div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12, color: 'var(--ink-1)' }}>
              See Atlas working in <span className="serif text-gradient" style={{ fontStyle: 'italic' }}>your kind of business</span>
            </div>
            <div style={{ fontSize: 16, color: 'var(--ink-3)' }}>Each demo loads a real dataset for that business type. No signup needed.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {list.map((b, i) => {
              const biz = ATLAS_BUSINESSES[b.id];
              return (
                <button
                  key={b.id}
                  onClick={() => onDemo(b.id)}
                  className="card"
                  style={{
                    padding: 24, textAlign: 'left', cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    display: 'flex', flexDirection: 'column', gap: 16, minHeight: 180,
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <BizAvatar business={biz} size={36}/>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>0{i+1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{b.desc}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: 12, color: 'var(--ink-2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="dot dot-positive"/>
                    Live data
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink-3)' }}>
                    Open <Icon name="arrow-right" size={12}/>
                  </span>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="product" style={{ background: 'var(--bg)', marginTop: 60 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>How it works</div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Raw data in. <span className="serif text-gradient" style={{ fontStyle: 'italic', fontWeight: 400 }}>Clear decisions out.</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}>
            {/* connector line */}
            <div style={{ position: 'absolute', top: 24, left: 'calc(12.5% + 16px)', right: 'calc(12.5% + 16px)', height: 2, background: 'linear-gradient(90deg, var(--border-subtle) 0%, var(--border-strong) 50%, var(--border-subtle) 100%)', zIndex: 0 }}/>
            {[
              {
                step: '01', icon: 'upload', color: 'var(--ink-1)',
                title: 'Connect your data',
                body: 'Upload PDFs, CSVs, and screenshots. Or connect Square, Google Business, Shopify, and more.',
              },
              {
                step: '02', icon: 'sparkles', color: 'var(--brand)',
                title: 'AI extracts structure',
                body: 'OCR + LLM pipeline converts unstructured files into normalized orders, products, reviews, and traffic.',
              },
              {
                step: '03', icon: 'lightbulb', color: 'var(--aurora)',
                title: 'Reasoning engine explains why',
                body: 'Atlas correlates time patterns, location data, and cross-source signals to explain every trend.',
              },
              {
                step: '04', icon: 'zap', color: 'var(--ember)',
                title: 'Act on what matters',
                body: 'Prioritized actions with projected impact. One click to apply or automate — no ops team needed.',
              },
            ].map((s, i) => (
              <div key={i} style={{ padding: '0 16px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', boxShadow: 'var(--shadow-sm)',
                }}>
                  <Icon name={s.icon} size={16} color={s.color}/>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 8 }}>{s.step}</div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{s.body}</div>
              </div>
            ))}
          </div>

          {/* Innovation callout */}
          <div style={{ marginTop: 40, padding: 20, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Icon name="sparkles" size={18} color="var(--brand)"/>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>AI OCR + LLM extraction</span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 8 }}>Atlas reads handwritten receipts, Instagram screenshots, and supplier invoices — not just structured spreadsheets.</span>
            </div>
            <button className="btn btn-sm" onClick={() => onDemo('baker')}>
              See it live <Icon name="arrow-right" size={12}/>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 32px', maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)' }}>
        <div>© 2026 Atlas Decision Intelligence Pvt. Ltd. · Bengaluru, India</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a>Privacy</a><a>Terms</a><a>Status</a><a>Contact</a>
        </div>
      </div>
    </div>
  );
};
