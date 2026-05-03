import React from 'react';
import { Icon, AtlasLogo } from './ui';

export const PricingPage = ({ onBack, onDemo, onSignup, onLogin, onNavigate }) => {
  const [billing, setBilling] = React.useState('annual'); // 'annual' | 'monthly'
  const [openFaq, setOpenFaq] = React.useState(0);

  const tiers = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'For solo founders just starting to wire up their data.',
      price: { monthly: 0, annual: 0 },
      cta: 'Start free',
      ctaKind: 'secondary',
      perks: [
        '1 business workspace',
        'Up to 3 connected data sources',
        '50 AI insight queries / month',
        '5 automation rules',
        '7-day data history',
        'Email support, 48h SLA',
      ],
      missing: ['Multi-business', 'Reports', 'API access'],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'For owner-operators ready to make Atlas their daily operating system.',
      price: { monthly: 2999, annual: 2499 },
      cta: 'Start 14-day trial',
      ctaKind: 'brand',
      featured: true,
      perks: [
        '3 business workspaces',
        'Unlimited data sources & uploads',
        'Unlimited AI insight queries',
        '50 automation rules',
        '12-month data history',
        'Scheduled reports (PDF, weekly + monthly)',
        'Priority support, 4h SLA',
        'Slack & email digests',
      ],
    },
    {
      id: 'team',
      name: 'Team',
      tagline: 'For small teams making decisions together across multiple locations.',
      price: { monthly: 7999, annual: 6999 },
      cta: 'Start 14-day trial',
      ctaKind: 'secondary',
      perks: [
        'Up to 10 business workspaces',
        'Up to 10 seats included',
        'Unlimited automations',
        '36-month data history',
        'Role-based permissions',
        'Custom report templates',
        'API access (10K calls / month)',
        'Audit log + SSO (Google, Microsoft)',
        'Dedicated success manager',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For multi-location operators, franchises, and groups with custom needs.',
      price: { monthly: 'Custom', annual: 'Custom' },
      cta: 'Talk to sales',
      ctaKind: 'secondary',
      perks: [
        'Unlimited workspaces & seats',
        'Custom data retention',
        'On-prem or VPC deployment',
        'SAML/OIDC SSO + SCIM',
        'Custom model fine-tuning',
        'White-label & embed',
        '99.9% uptime SLA',
        'Named architect + 24/7 support',
        'Enterprise security & compliance package (contact us)',
      ],
    },
  ];

  const compare = [
    { section: 'Workspaces & seats', rows: [
      ['Business workspaces', '1', '3', '10', 'Unlimited'],
      ['Team seats', '1', '3', '10', 'Unlimited'],
      ['Multi-location rollup', false, false, true, true],
    ]},
    { section: 'Data & AI', rows: [
      ['Connected data sources', '3', 'Unlimited', 'Unlimited', 'Unlimited'],
      ['File uploads / month', '20', '500', '5,000', 'Unlimited'],
      ['AI insight queries / month', '50', 'Unlimited', 'Unlimited', 'Unlimited'],
      ['Data history', '7 days', '12 months', '36 months', 'Custom'],
      ['Custom model fine-tuning', false, false, false, true],
    ]},
    { section: 'Automations', rows: [
      ['Active automation rules', '5', '50', 'Unlimited', 'Unlimited'],
      ['Scheduled reports', false, true, true, true],
      ['Webhook triggers', false, true, true, true],
      ['External actions (Slack, email, PO drafts)', false, true, true, true],
    ]},
    { section: 'Security & compliance', rows: [
      ['Single Sign-On (SSO)', false, false, true, true],
      ['Audit log', false, '30 days', '12 months', 'Custom'],
      ['Custom DPA', false, false, true, true],
      ['On-prem / VPC deployment', false, false, false, true],
    ]},
    { section: 'Support', rows: [
      ['Email support', '48h SLA', '4h SLA', '2h SLA', '24/7'],
      ['Dedicated success manager', false, false, true, true],
      ['Solution architect', false, false, false, true],
    ]},
  ];

  const faqs = [
    { q: 'How does Atlas handle my business data?', a: 'Your raw data is stored in your isolated workspace, encrypted at rest with AES-256 and in transit with TLS 1.3. By default, raw uploads are retained for 90 days for audit purposes; you can shorten this in Settings → Data preferences. Atlas only trains on aggregated, anonymized patterns — never on raw customer data — and you can opt out entirely on Pro and above.' },
    { q: 'What happens at the end of my trial?', a: 'Your data and configuration are preserved. If you do not upgrade, your workspace moves to a read-only state for 30 days, after which it is archived. You can restore from archive within 90 days at no cost.' },
    { q: 'Can I switch plans later?', a: 'Yes, upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing period. Annual plans are pro-rated when upgrading mid-term.' },
    { q: 'Do you offer non-profit or education discounts?', a: 'Yes — 50% off Pro and Team for verified non-profits, registered charities, and educational institutions. Email atlas@atlas.so with documentation.' },
    { q: 'Which integrations come with each plan?', a: 'All available integrations are included on every paid plan. Starter is limited to 3 simultaneously connected sources. There are no per-integration fees.' },
    { q: 'How is the AI different from a generic chatbot?', a: 'Atlas runs a multi-agent system grounded in your live data with deterministic retrieval, tool use, and a domain model trained on millions of small-business operating patterns. Every claim it makes cites the underlying signals so you can verify it. It is not a wrapper around a chat model.' },
    { q: 'What if my business has its own database or data warehouse?', a: 'On Team and Enterprise we connect directly to Postgres, MySQL, BigQuery, Snowflake, Redshift, and Databricks. Read-only by default; writeback is opt-in per source.' },
    { q: 'Is there a free trial for Team and Enterprise?', a: 'Yes — 14 days free on Team. Enterprise includes a guided 30-day proof of concept with one of our solution architects.' },
  ];

  const Check = () => <Icon name="check" size={13} strokeWidth={2.5} color="var(--positive)"/>;
  const Dash = () => <span style={{ color: 'var(--ink-4)', fontSize: 14 }}>—</span>;
  const cellVal = (v) => v === true ? <Check/> : v === false ? <Dash/> : <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{v}</span>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(250,250,249,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={onBack} style={{ cursor: 'pointer' }}><AtlasLogo/></div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
            <a onClick={onBack} style={{ cursor: 'pointer' }}>Product</a>
            <a onClick={() => onNavigate('pricing')} style={{ cursor: 'pointer', color: 'var(--ink-1)', fontWeight: 500 }}>Pricing</a>
            <a onClick={() => onNavigate('docs')} style={{ cursor: 'pointer' }}>Docs</a>
            <a onClick={onBack} style={{ cursor: 'pointer' }}>Demos</a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onLogin}>Log in</button>
            <button className="btn btn-primary" onClick={onSignup}>Get started</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="brand-glow" style={{ paddingTop: 72, paddingBottom: 32 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'var(--brand-soft)', border: '1px solid var(--brand-tint)', fontSize: 12, color: 'var(--brand-deep)', fontWeight: 500, marginBottom: 24 }}>
            <Icon name="sparkles" size={12}/>
            Pricing built for operators, not enterprises pretending to be small
          </div>
          <h1 style={{ fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.035em', fontWeight: 500, margin: '0 0 20px' }}>
            One price. <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--brand)' }}>Every system you'll ever connect.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 600, margin: '0 auto 28px' }}>
            We don't charge per integration, per query, or per insight. Just per workspace. The number that matters is what Atlas saves you, not what we charge.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, marginBottom: 8 }}>
            <button onClick={() => setBilling('monthly')} style={{ padding: '7px 16px', borderRadius: 999, border: 'none', background: billing === 'monthly' ? 'var(--ink-1)' : 'transparent', color: billing === 'monthly' ? 'white' : 'var(--ink-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Monthly</button>
            <button onClick={() => setBilling('annual')} style={{ padding: '7px 16px', borderRadius: 999, border: 'none', background: billing === 'annual' ? 'var(--ink-1)' : 'transparent', color: billing === 'annual' ? 'white' : 'var(--ink-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Annual
              <span style={{ padding: '1px 6px', borderRadius: 999, background: billing === 'annual' ? 'rgba(255,255,255,0.18)' : 'var(--brand-soft)', color: billing === 'annual' ? 'white' : 'var(--brand-deep)', fontSize: 10, fontWeight: 600 }}>Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {tiers.map(t => (
            <div key={t.id} className="card" style={{
              padding: 24, position: 'relative',
              border: t.featured ? '1px solid var(--brand)' : '1px solid var(--border)',
              boxShadow: t.featured ? '0 12px 32px rgba(79,70,229,0.10), 0 0 0 4px var(--brand-soft)' : 'var(--shadow-xs)',
              display: 'flex', flexDirection: 'column',
            }}>
              {t.featured && <div style={{ position: 'absolute', top: -10, left: 24, padding: '3px 10px', background: 'var(--brand)', color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: 999 }}>Most popular</div>}
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', minHeight: 36, lineHeight: 1.4, marginBottom: 16 }}>{t.tagline}</div>
              <div style={{ marginBottom: 18 }}>
                {typeof t.price[billing] === 'number' ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em' }}>₹{t.price[billing]}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/{billing === 'annual' ? 'mo, billed yearly' : 'mo'}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>{t.price[billing]}</div>
                )}
                {billing === 'annual' && typeof t.price.monthly === 'number' && t.price.monthly > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4, textDecoration: 'line-through' }}>₹{t.price.monthly}/mo monthly</div>
                )}
              </div>
              <button className={`btn ${t.ctaKind === 'brand' ? 'btn-brand' : ''}`} style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }} onClick={t.id === 'starter' ? onSignup : t.id === 'enterprise' ? () => {} : onSignup}>{t.cta}</button>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {t.perks.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                    <Icon name="check" size={13} strokeWidth={2.5} color="var(--positive)" className=""/>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div style={{ marginTop: 48, padding: 24, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { icon: 'lock', t: 'Data encrypted at rest', s: 'AES-256 + TLS 1.3' },
            { icon: 'shield', t: 'Encrypted at rest', s: 'AES-256 + TLS 1.3' },
            { icon: 'globe', t: 'Data residency', s: 'US, EU, APAC regions' },
            { icon: 'check', t: '99.9% uptime', s: '90-day rolling avg' },
          ].map((b, i) => {
            const ic = b.icon === 'shield' ? 'circle-check' : b.icon === 'check' ? 'circle-check' : b.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ic} size={16}/>
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{b.s}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ background: 'var(--bg-tinted)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Compare every feature</div>
          <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>The whole picture</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Side by side, every capability across every plan.</div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <div style={{ padding: '14px 18px', fontSize: 12, fontWeight: 600 }}>&nbsp;</div>
              {tiers.map(t => (
                <div key={t.id} style={{ padding: '14px 18px', borderLeft: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.featured ? 'var(--brand-deep)' : 'var(--ink-1)' }}>{t.name}</div>
                   <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                     {typeof t.price[billing] === 'number' ? `₹${t.price[billing]}/mo` : t.price[billing]}
                   </div>
                </div>
              ))}
            </div>
            {compare.map((sec, si) => (
              <React.Fragment key={si}>
                <div style={{ padding: '14px 18px', background: 'var(--bg-tinted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderTop: si === 0 ? 'none' : '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>{sec.section}</div>
                {sec.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                    <div style={{ padding: '12px 18px', fontSize: 13, color: 'var(--ink-2)' }}>{row[0]}</div>
                    {row.slice(1).map((v, vi) => (
                      <div key={vi} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>{cellVal(v)}</div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ROI calculator */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brand-deep)' }}>The math</div>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 12 }}>Atlas pays for itself <span className="serif" style={{ fontStyle: 'italic', color: 'var(--brand)' }}>in week one</span></div>
             <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 16 }}>
               Across our customer base, the median Pro user catches <strong>₹1,200–₹3,800</strong> in monthly leakage in the first 30 days — pricing errors, inventory waste, churned customers, missed reorders.
             </p>
             <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
               At ₹39/mo on annual, that's a 30–95× return before counting the hours you don't spend in spreadsheets.
             </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => onDemo('baker')}><Icon name="play" size={13}/> See it on a real business</button>
              <button className="btn">Read the methodology</button>
            </div>
          </div>
          <div className="card" style={{ padding: 28, background: 'linear-gradient(180deg, var(--brand-soft) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--brand-tint)' }}>
            <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--brand-deep)' }}>Median Pro customer · 90 days</div>
            {[
              { label: 'Inventory waste avoided', val: '₹2,140 / mo', color: 'var(--brand)' },
              { label: 'Margin recovered (pricing fixes)', val: '₹1,820 / mo', color: 'var(--aurora)' },
              { label: 'Hours saved on reporting', val: '14 hrs / mo', color: 'var(--ember)' },
              { label: 'Reorders never missed', val: '8 / mo', color: 'var(--rose)' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border-subtle)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }}/>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', flex: 1 }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--brand-tint)', textAlign: 'center' }}>
              <div className="eyebrow" style={{ color: 'var(--brand-deep)', marginBottom: 4 }}>Total monthly impact</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--brand-deep)' }}>₹3,960 + 14 hrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons */}
      <div style={{ background: 'var(--bg-tinted)', borderTop: '1px solid var(--border-subtle)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Add-ons</div>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 28 }}>Plug in only what you need</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
             {[
               { icon: 'building', tone: 'brand', name: 'Extra workspace', price: '₹15 /mo', body: 'Add another business to the same account. Atlas keeps data isolated; insights and reports remain per-workspace.' },
               { icon: 'users', tone: 'aurora', name: 'Additional seat', price: '₹12 /mo', body: 'Bring a co-founder, accountant, or store manager. Granular permissions per workspace.' },
               { icon: 'database', tone: 'ember', name: 'Warehouse sync', price: '₹99 /mo', body: 'Read directly from Postgres, BigQuery, Snowflake, Redshift, or Databricks. CDC + scheduled syncs.' },
               { icon: 'zap', tone: 'rose', name: 'Action API', price: '₹0.002 /call', body: 'Programmatic access to insights, automations, and write-back actions. Includes 10K free calls/mo on Team.' },
               { icon: 'file', tone: 'gold', name: 'Custom reports', price: '₹49 /mo', body: 'White-label PDF templates with your branding. Schedule weekly or monthly to investors and ops.' },
               { icon: 'sparkles', tone: 'brand', name: 'Domain fine-tune', price: 'Custom', body: 'We tune the Atlas decision model on your historical data for 8–14% better precision on category-specific metrics.' },
             ].map((a, i) => {
              const tone = a.tone;
              const bg = `var(--${tone}-soft)`;
              const fg = tone === 'brand' ? 'var(--brand-deep)' : `var(--${tone})`;
              return (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 7, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={a.icon} size={15}/>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>{a.price}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{a.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '72px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>FAQ</div>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 32 }}>Honest answers</div>
        <div className="card" style={{ padding: 0 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: i === faqs.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} style={{ width: '100%', textAlign: 'left', padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{f.q}</span>
                <Icon name="chevron-down" size={14} color="var(--ink-3)" className={openFaq === i ? 'rot' : ''}/>
              </button>
              {openFaq === i && (
                <div className="fade-in" style={{ padding: '0 22px 20px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ background: 'var(--ink-1)', color: 'white', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.025em', marginBottom: 16, lineHeight: 1.15 }}>
            Stop wondering. <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, color: '#a5b4fc' }}>Start deciding.</span>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 28, maxWidth: 540, margin: '0 auto 28px' }}>
            14 days on Pro, no card required. Plug in your data and see your first insight in under 2 minutes.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-lg" style={{ background: 'white', color: 'var(--ink-1)', borderColor: 'white' }} onClick={onSignup}>Start free trial<Icon name="arrow-right" size={14}/></button>
            <button className="btn btn-lg" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }} onClick={() => onDemo('baker')}>Try a demo</button>
          </div>
        </div>
      </div>
    </div>
  );
};


