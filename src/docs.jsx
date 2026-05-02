import React from 'react';
import { Icon, AtlasLogo } from './ui';

export const DocsPage = ({ onBack, onDemo, onSignup, onLogin, onNavigate }) => {
  const [active, setActive] = React.useState('intro');
  const [query, setQuery] = React.useState('');

  const sections = [
    { group: 'Getting started', items: [
      { id: 'intro', label: 'Introduction' },
      { id: 'quickstart', label: 'Quickstart in 5 minutes' },
      { id: 'concepts', label: 'Core concepts' },
      { id: 'workspace', label: 'Workspace & seats' },
    ]},
    { group: 'Connecting data', items: [
      { id: 'sources', label: 'Data sources overview' },
      { id: 'uploads', label: 'File uploads (PDF, CSV, images)' },
      { id: 'integrations', label: 'Native integrations' },
      { id: 'warehouse', label: 'Warehouse sync' },
      { id: 'webhooks', label: 'Webhooks & events' },
    ]},
    { group: 'Insights & decisions', items: [
      { id: 'engine', label: 'How the decision engine works' },
      { id: 'signals', label: 'Signal taxonomy' },
      { id: 'confidence', label: 'Confidence scoring' },
      { id: 'goals', label: 'Goal-aware ranking' },
    ]},
    { group: 'Automations', items: [
      { id: 'rules', label: 'Rule builder' },
      { id: 'actions', label: 'Action library' },
      { id: 'approvals', label: 'Approval flows' },
    ]},
    { group: 'Developer', items: [
      { id: 'api', label: 'REST API reference' },
      { id: 'sdks', label: 'Client SDKs' },
      { id: 'auth', label: 'Authentication' },
      { id: 'rate', label: 'Rate limits' },
    ]},
    { group: 'Trust & security', items: [
      { id: 'security', label: 'Security model' },
      { id: 'compliance', label: 'Compliance & certifications' },
      { id: 'residency', label: 'Data residency' },
    ]},
  ];

  const flat = sections.flatMap(s => s.items);

  const Code = ({ children, lang = 'http' }) => (
    <pre style={{ background: '#0f0f10', color: '#e7e5e4', padding: 16, borderRadius: 8, fontSize: 12.5, fontFamily: 'var(--font-mono)', overflowX: 'auto', lineHeight: 1.55, margin: '12px 0', border: '1px solid #1c1917' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #1c1917' }}>
        <span style={{ fontSize: 10, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lang}</span>
        <span style={{ fontSize: 10, color: '#78716c', cursor: 'pointer' }}>Copy</span>
      </div>
      <code style={{ fontFamily: 'inherit' }}>{children}</code>
    </pre>
  );

  const H = ({ children }) => <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{children}</h2>;
  const H3 = ({ children }) => <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', margin: '32px 0 10px' }}>{children}</h3>;
  const P = ({ children }) => <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, margin: '0 0 14px' }}>{children}</p>;
  const Note = ({ tone = 'brand', icon = 'info', title, children }) => {
    const bg = `var(--${tone}-soft)`;
    const fg = tone === 'brand' ? 'var(--brand-deep)' : `var(--${tone})`;
    return (
      <div style={{ padding: 14, borderRadius: 8, background: bg, border: `1px solid ${fg}25`, margin: '14px 0', display: 'flex', gap: 12 }}>
        <Icon name={icon} size={16} color={fg}/>
        <div>
          {title && <div style={{ fontSize: 13, fontWeight: 600, color: fg, marginBottom: 4 }}>{title}</div>}
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{children}</div>
        </div>
      </div>
    );
  };

  const content = {
    intro: (
      <>
        <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brand-deep)' }}>Welcome</div>
        <H>Atlas, end-to-end</H>
        <P>Atlas is a decision-intelligence layer for operating businesses. It connects to the systems where your data already lives — POS, e-commerce, accounting, reviews, inventory, calendars, warehouses — and turns that fragmented stream into three answers: <strong>what is happening, why it is happening, and what you should do next</strong>.</P>
        <P>This documentation covers everything from a 5-minute quickstart to the production REST API. If you're new, start with the <a onClick={() => setActive('quickstart')} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--brand-tint)', textUnderlineOffset: 3 }}>quickstart</a>. If you're integrating, jump to the <a onClick={() => setActive('api')} style={{ color: 'var(--brand)', cursor: 'pointer' }}>API reference</a>.</P>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '24px 0' }}>
          {[
            { tone: 'brand', icon: 'play', title: 'Try a live demo', body: 'Six pre-loaded businesses you can poke at without signing up.', cta: 'Open demos', onClick: () => onDemo('baker') },
            { tone: 'aurora', icon: 'database', title: 'Connect your data', body: 'Native integrations, file uploads, or direct warehouse sync.', cta: 'Read the guide', onClick: () => setActive('sources') },
            { tone: 'ember', icon: 'zap', title: 'Build an automation', body: 'Trigger Atlas on events. Draft, approve, fire.', cta: 'Rule builder', onClick: () => setActive('rules') },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={c.onClick}>
              <span style={{ width: 32, height: 32, borderRadius: 7, background: `var(--${c.tone}-soft)`, color: c.tone === 'brand' ? 'var(--brand-deep)' : `var(--${c.tone})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name={c.icon} size={15}/>
              </span>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 12 }}>{c.body}</div>
              <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}>{c.cta} →</span>
            </div>
          ))}
        </div>

        <H3>What Atlas is not</H3>
        <P>Atlas is not a BI tool you plug a SQL editor into, and it is not a chatbot. It is an opinionated decision system. Every recommendation is grounded in your data, ranked against your goals, and traceable back to the signals that produced it.</P>
      </>
    ),
    quickstart: (
      <>
        <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brand-deep)' }}>Getting started · 5 min</div>
        <H>Quickstart</H>
        <P>By the end of this guide you'll have Atlas connected to one data source and producing your first insight.</P>

        <H3>1. Create your workspace</H3>
        <P>Sign up with email or Google. You'll be asked for your business name and address — Atlas uses public sources to auto-detect your category, channel mix, and benchmarks.</P>

        <H3>2. Connect your first source</H3>
        <P>The fastest path is uploading a sales export. Atlas accepts CSV, PDF (we OCR), Excel, and image formats up to 50 MB.</P>
        <Code lang="bash">{`curl -X POST https://api.atlas.so/v1/uploads \\
  -H "Authorization: Bearer $ATLAS_API_KEY" \\
  -F "file=@sales-q1.csv" \\
  -F "workspace_id=ws_8f3..."`}</Code>
        <P>Or use one of 80+ native integrations — Square, Shopify, QuickBooks, Stripe, Google Business, Instagram, and so on. OAuth flow takes about 60 seconds.</P>

        <H3>3. Set your goals</H3>
        <P>Pick the outcomes you optimize for: revenue, repeat customers, inventory turnover, response time. Atlas weights insights and ranks actions according to these.</P>

        <H3>4. Open the Overview</H3>
        <P>Within ~90 seconds of connection, Atlas produces your first set of metrics, root-cause insights, and ranked actions. From here, every page in the product is a deeper view of one of those three layers.</P>

        <Note tone="brand" icon="lightbulb" title="Tip">The richer your sources, the sharper Atlas gets. Most users see a 2–3× lift in confidence scores after connecting a second system, because cross-source correlation is where the magic compounds.</Note>
      </>
    ),
    concepts: (
      <>
        <H>Core concepts</H>
        <P>A small vocabulary you'll see everywhere in Atlas.</P>
        <div className="card" style={{ padding: 0, marginTop: 8 }}>
          {[
            ['Workspace', 'A single business with its own data, goals, and configuration. Users can be members of multiple workspaces.'],
            ['Source', 'Anything Atlas reads from — an integration, an upload, a warehouse, or a webhook stream.'],
            ['Signal', 'A typed measurement extracted from sources. Examples: order_count, review_sentiment, inventory_units, foot_traffic.'],
            ['Insight', 'A causal claim Atlas surfaces about your business, with cited evidence. Insights have a severity (positive, info, warning, risk).'],
            ['Action', 'A ranked recommendation, scored on impact, effort, and confidence. Actions can be applied, dismissed, or converted into tasks.'],
            ['Automation', 'A persistent rule: when condition, do action. Conditions reference signals; actions reference the action library.'],
            ['Goal', 'An outcome you want to optimize. Goals influence how insights are ranked and which actions are surfaced first.'],
          ].map(([t, d], i) => (
            <div key={i} style={{ padding: '14px 18px', borderBottom: i === 6 ? 'none' : '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, alignItems: 'baseline' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--brand-deep)' }}>{t}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </>
    ),
    workspace: (<>
      <H>Workspace & seats</H>
      <P>Each workspace represents one business. Pro accounts can host up to 3 workspaces in a single account; Team scales to 10. Members can have role-based access: Owner, Admin, Operator, or Viewer.</P>
      <H3>Roles</H3>
      <Code lang="json">{`{
  "Owner":    ["billing", "sources", "automations", "members", "data:read", "data:write"],
  "Admin":    ["sources", "automations", "members", "data:read", "data:write"],
  "Operator": ["sources:read", "automations:write", "data:read"],
  "Viewer":   ["data:read"]
}`}</Code>
    </>),
    sources: (<>
      <H>Data sources overview</H>
      <P>Atlas accepts data four ways: native integrations, file uploads, warehouse sync, and webhook ingestion. Each source becomes a stream of typed signals, normalized into the unified Atlas data model.</P>
      <H3>Comparison</H3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', background: 'var(--bg-tinted)', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>Source type</div><div>Latency</div><div>Plan</div><div>Best for</div>
        </div>
        {[
          ['Native integration (OAuth)', '~5 min', 'All', 'Most teams'],
          ['File upload', 'Seconds', 'All', 'Ad-hoc analysis'],
          ['Webhook ingestion', 'Real-time', 'Pro+', 'Custom systems'],
          ['Warehouse (Postgres, BQ, Snowflake)', '5 min CDC', 'Team+', 'Mature data stacks'],
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', padding: '12px 16px', fontSize: 13, color: 'var(--ink-2)', borderBottom: i === 3 ? 'none' : '1px solid var(--border-subtle)' }}>
            {r.map((c, j) => <div key={j}>{c}</div>)}
          </div>
        ))}
      </div>
    </>),
    integrations: (<>
      <H>Native integrations</H>
      <P>OAuth-based, audited, and read-only by default. Writeback is opt-in per source.</P>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
        {[
          ['Square', 'POS', 'aurora'], ['Shopify', 'E-commerce', 'aurora'], ['Stripe', 'Payments', 'brand'],
          ['QuickBooks', 'Accounting', 'aurora'], ['Xero', 'Accounting', 'aurora'], ['Google Business', 'Reviews + traffic', 'ember'],
          ['Instagram', 'Engagement', 'rose'], ['TikTok', 'Engagement', 'rose'], ['Facebook', 'Engagement', 'brand'],
          ['Yelp', 'Reviews', 'ember'], ['Toast', 'POS', 'aurora'], ['Lightspeed', 'POS', 'aurora'],
          ['Mailchimp', 'Email', 'gold'], ['Klaviyo', 'Email', 'gold'], ['Slack', 'Notifications', 'brand'],
        ].map(([n, c, t], i) => (
          <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `var(--${t}-soft)`, color: t === 'brand' ? 'var(--brand-deep)' : `var(--${t})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{n[0]}</span>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c}</div></div>
          </div>
        ))}
      </div>
      <P style={{ marginTop: 16 }}>And 65 more. Don't see yours? <a style={{ color: 'var(--brand)', cursor: 'pointer' }}>Request an integration →</a></P>
    </>),
    uploads: (<>
      <H>File uploads</H>
      <P>Atlas extracts structured data from CSV, Excel, PDF (text + scanned), and images (receipts, screenshots). PDFs are processed with a layout-aware OCR pipeline that preserves table structure.</P>
      <Code lang="bash">{`POST /v1/uploads
Authorization: Bearer $ATLAS_API_KEY
Content-Type: multipart/form-data

file=@receipts.pdf
workspace_id=ws_...
hint=expense_report`}</Code>
    </>),
    warehouse: (<>
      <H>Warehouse sync</H>
      <P>For mature data stacks, Atlas reads directly from your warehouse with CDC-based change tracking. Supported: Postgres, MySQL, BigQuery, Snowflake, Redshift, Databricks.</P>
      <Code lang="sql">{`-- Atlas creates a read-only role with grants only on tables you select
CREATE ROLE atlas_reader;
GRANT USAGE ON SCHEMA analytics TO atlas_reader;
GRANT SELECT ON analytics.orders, analytics.line_items TO atlas_reader;`}</Code>
    </>),
    webhooks: (<>
      <H>Webhooks & events</H>
      <P>Push events into Atlas in real time. Each event becomes one or more signals.</P>
      <Code lang="json">{`POST https://ingest.atlas.so/v1/events
Authorization: Bearer $ATLAS_INGEST_TOKEN
Content-Type: application/json

{
  "workspace_id": "ws_8f3a...",
  "type":   "order.completed",
  "occurred_at": "2026-05-02T14:21:04Z",
  "payload": {
    "order_id": "ord_91b...",
    "amount":   42.50,
    "currency": "USD",
    "channel":  "in_store",
    "items":    [{ "sku": "SD-LRG", "qty": 1 }]
  }
}`}</Code>
    </>),
    engine: (<>
      <H>How the decision engine works</H>
      <P>Atlas runs a four-stage pipeline on top of your normalized signals.</P>
      <div className="card" style={{ padding: 0, marginTop: 12 }}>
        {[
          ['1', 'Ingest', 'Signals are extracted from sources, deduplicated, and time-aligned. Anomalies are flagged for downstream stages.', 'aurora'],
          ['2', 'Correlate', 'A causal model relates signals across sources — e.g., a spike in Saturday orders to a recent Instagram post. Counterfactuals discard spurious links.', 'brand'],
          ['3', 'Rank', 'Insights and candidate actions are scored against your goals, with confidence intervals. Goal-aware ranking puts the highest-leverage moves first.', 'ember'],
          ['4', 'Cite', 'Every claim references the signals that produced it. You can drill into any number on the dashboard to see the evidence.', 'rose'],
        ].map(([n, t, d, tone], i) => (
          <div key={i} style={{ padding: '16px 18px', borderBottom: i === 3 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', gap: 14 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `var(--${tone}-soft)`, color: tone === 'brand' ? 'var(--brand-deep)' : `var(--${tone})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{n}</span>
            <div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t}</div><div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{d}</div></div>
          </div>
        ))}
      </div>
    </>),
    signals: (<>
      <H>Signal taxonomy</H>
      <P>The Atlas data model normalizes inputs into a finite set of typed signals. Custom signals are supported via the API.</P>
      <Code lang="ts">{`type Signal =
  | { kind: 'revenue';    amount: Money; period: TimeRange; channel?: string }
  | { kind: 'order';      id: string; total: Money; items: LineItem[] }
  | { kind: 'inventory';  sku: string; units: number; cost: Money }
  | { kind: 'review';     stars: 1|2|3|4|5; text?: string; source: string }
  | { kind: 'visit';      count: number; period: TimeRange; source: string }
  | { kind: 'cost';       category: string; amount: Money; period: TimeRange }
  | { kind: 'staffing';   role: string; hours: number; period: TimeRange }
  | { kind: 'custom';     key: string; value: number | string; tags?: string[] }`}</Code>
    </>),
    confidence: (<>
      <H>Confidence scoring</H>
      <P>Every action carries a confidence score in [0, 100]. The score combines signal coverage, statistical significance of the underlying pattern, similarity to outcomes Atlas has observed in comparable businesses, and the recency of the data.</P>
      <Note tone="warning" icon="alert" title="Read confidence carefully">A 70% confidence score does not mean the action will succeed 70% of the time. It means Atlas is 70% confident the projected impact range is correct.</Note>
    </>),
    goals: (<>
      <H>Goal-aware ranking</H>
      <P>Goals you set in Settings shape how Atlas weights insights. A pharmacy that selects "reduce wait times" will see staffing and workflow insights ranked above front-of-store merchandising; a cafe optimizing "increase repeat customers" will see loyalty insights surface first.</P>
    </>),
    rules: (<>
      <H>Rule builder</H>
      <P>Automations are <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }}>WHEN signal/condition THEN action</code> rules. Conditions can chain with AND/OR.</P>
      <Code lang="yaml">{`name: Low stock reorder draft
when:
  all:
    - signal: inventory.units
      sku: SD-LRG
      operator: less_than
      value: 24
    - signal: forecast.demand
      horizon: 7d
      operator: greater_than
      value: 30
then:
  action: drafts.send_email
  to:    supplier@kingarthurflour.com
  template: reorder_v2
  approval: required`}</Code>
    </>),
    actions: (<>
      <H>Action library</H>
      <P>Actions are pre-built integrations with external systems, plus internal Atlas operations.</P>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
        {[
          ['drafts.send_email', 'aurora', 'Compose and send an email draft (requires approval).'],
          ['drafts.reply_review', 'rose', 'Draft a personalized reply to a review.'],
          ['inventory.create_po', 'ember', 'Create a purchase order in your inventory system.'],
          ['notifications.slack', 'brand', 'Send a Slack message to a channel.'],
          ['tasks.create', 'gold', 'Create a task in your workspace task list.'],
          ['marketing.post_promo', 'rose', 'Schedule a promotional post on Instagram or Facebook.'],
        ].map(([k, tone, d], i) => (
          <div key={i} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: tone === 'brand' ? 'var(--brand)' : `var(--${tone})` }}/>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{k}</code>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </>),
    approvals: (<>
      <H>Approval flows</H>
      <P>Sensitive actions (sending emails, creating POs, posting publicly) require approval by default. Atlas drafts the content; you approve, edit, or reject from the inbox or via Slack.</P>
    </>),
    api: (<>
      <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brand-deep)' }}>Developer</div>
      <H>REST API reference</H>
      <P>Base URL: <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }}>https://api.atlas.so/v1</code>. All requests require a Bearer token.</P>

      <H3>Get insights</H3>
      <Code lang="http">{`GET /v1/insights?workspace_id=ws_8f3a&since=2026-04-01
Authorization: Bearer $ATLAS_API_KEY

200 OK
{
  "data": [
    {
      "id": "ins_91b...",
      "title": "Weekend orders are driving growth",
      "severity": "positive",
      "confidence": 0.92,
      "evidence": ["sig_orders_by_dow", "sig_product_mix"],
      "created_at": "2026-04-28T08:14:00Z"
    }
  ],
  "page": { "next": null }
}`}</Code>

      <H3>Apply an action</H3>
      <Code lang="http">{`POST /v1/actions/act_7f2.../apply
Authorization: Bearer $ATLAS_API_KEY
Content-Type: application/json

{ "approve": true, "notes": "Approved via API" }`}</Code>

      <H3>Stream events (SSE)</H3>
      <Code lang="http">{`GET /v1/events/stream?workspace_id=ws_8f3a
Accept: text/event-stream

event: insight.created
data: { "id": "ins_...", "severity": "warning" }

event: action.applied
data: { "id": "act_...", "by": "user_..." }`}</Code>
    </>),
    sdks: (<>
      <H>Client SDKs</H>
      <P>Officially supported: TypeScript, Python, Go, Ruby. Community: Elixir, Rust, PHP.</P>
      <Code lang="ts">{`import { Atlas } from "@atlas/sdk";

const atlas = new Atlas({ apiKey: process.env.ATLAS_API_KEY });

const insights = await atlas.insights.list({
  workspaceId: "ws_8f3a...",
  since: "2026-04-01",
  severity: ["warning", "negative"],
});

for (const ins of insights.data) {
  console.log(ins.title, ins.confidence);
}`}</Code>
    </>),
    auth: (<>
      <H>Authentication</H>
      <P>Two modes: <strong>API keys</strong> for server-to-server, and <strong>OAuth 2.0</strong> for third-party apps acting on behalf of users.</P>
      <Code lang="http">{`# API key (server)
Authorization: Bearer atlas_sk_live_...

# OAuth (3rd-party app)
Authorization: Bearer <user_access_token>
Atlas-Workspace-Id: ws_...`}</Code>
    </>),
    rate: (<>
      <H>Rate limits</H>
      <P>Limits are per workspace and reset every minute. Burst capacity is 2× the steady-state limit for up to 10 seconds.</P>
      <div className="card" style={{ padding: 0 }}>
        {[['Starter', '60 req/min'], ['Pro', '600 req/min'], ['Team', '3,000 req/min'], ['Enterprise', 'Custom']].map(([p, r], i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: i === 3 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>{p}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--brand-deep)', fontWeight: 600 }}>{r}</span>
          </div>
        ))}
      </div>
    </>),
    security: (<>
      <H>Security model</H>
      <P>Defense in depth across data, infrastructure, and access.</P>
      <div className="card" style={{ padding: 0 }}>
        {[
          ['Encryption', 'AES-256 at rest, TLS 1.3 in transit. Per-workspace KMS keys on Enterprise.'],
          ['Isolation', 'Each workspace runs in its own logical tenant. No cross-tenant queries are possible.'],
          ['Access', 'Least-privilege RBAC, optional SSO (Google, Microsoft, Okta), SCIM provisioning on Team+.'],
          ['Audit', 'Immutable audit log of every read and write action. Exportable to your SIEM.'],
          ['Network', 'Private link / VPC peering on Enterprise. Egress to your warehouses over your subnet.'],
          ['Secrets', 'Customer credentials live in HSM-backed vaults. We cannot read them.'],
        ].map(([t, d], i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: i === 5 ? 'none' : '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--brand-deep)' }}>{t}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{d}</div>
          </div>
        ))}
      </div>
    </>),
    compliance: (<>
      <H>Compliance & certifications</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
        {[['SOC 2 Type II', 'Audited annually'], ['ISO 27001', 'Certified'], ['GDPR', 'DPA available'], ['CCPA', 'Compliant'], ['HIPAA', 'Eligible (Enterprise)'], ['PCI DSS', 'Level 4 (no card storage)']].map(([t, s], i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <Icon name="circle-check" size={18} color="var(--brand)"/>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>{t}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s}</div>
          </div>
        ))}
      </div>
    </>),
    residency: (<>
      <H>Data residency</H>
      <P>Choose where your data lives. Atlas operates regions in:</P>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
        {[['us-east-1', 'N. Virginia'], ['us-west-2', 'Oregon'], ['eu-west-1', 'Ireland'], ['eu-central-1', 'Frankfurt'], ['ap-southeast-2', 'Sydney'], ['ap-northeast-1', 'Tokyo']].map(([c, n], i) => (
          <div key={i} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="globe" size={16} color="var(--brand)"/>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{c}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{n}</div></div>
          </div>
        ))}
      </div>
    </>),
  };

  const filtered = !query ? sections : sections.map(s => ({
    ...s, items: s.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
  })).filter(s => s.items.length);

  const idx = flat.findIndex(f => f.id === active);
  const prev = flat[idx - 1], next = flat[idx + 1];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(250,250,249,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={onBack} style={{ cursor: 'pointer' }}><AtlasLogo/></div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
            <a onClick={onBack} style={{ cursor: 'pointer' }}>Product</a>
            <a onClick={() => onNavigate('pricing')} style={{ cursor: 'pointer' }}>Pricing</a>
            <a onClick={() => onNavigate('docs')} style={{ cursor: 'pointer', color: 'var(--ink-1)', fontWeight: 500 }}>Docs</a>
            <a onClick={onBack} style={{ cursor: 'pointer' }}>Demos</a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onLogin}>Log in</button>
            <button className="btn btn-brand" onClick={onSignup}>Get started</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr 200px', gap: 0 }}>
        {/* Sidebar */}
        <aside style={{ borderRight: '1px solid var(--border-subtle)', padding: '32px 20px', height: 'calc(100vh - 56px)', overflow: 'auto', position: 'sticky', top: 56 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input className="input" style={{ paddingLeft: 30, fontSize: 12 }} placeholder="Search docs…" value={query} onChange={(e) => setQuery(e.target.value)}/>
            <span style={{ position: 'absolute', left: 10, top: 10 }}><Icon name="search" size={12} color="var(--ink-4)"/></span>
          </div>
          {filtered.map(g => (
            <div key={g.group} style={{ marginBottom: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>{g.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {g.items.map(it => {
                  const isActive = active === it.id;
                  return (
                    <button key={it.id} onClick={() => setActive(it.id)} style={{
                      textAlign: 'left', padding: '5px 8px', border: 'none',
                      background: isActive ? 'var(--brand-soft)' : 'transparent',
                      color: isActive ? 'var(--brand-deep)' : 'var(--ink-2)',
                      fontWeight: isActive ? 500 : 400,
                      fontSize: 12.5, borderRadius: 5, cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >{it.label}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ padding: '40px 48px', maxWidth: 760, minWidth: 0 }} key={active} className="fade-in">
          <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
            DOCS / {sections.find(s => s.items.find(i => i.id === active))?.group.toUpperCase()}
          </div>
          {content[active] || content.intro}

          {/* Pager */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
            {prev ? (
              <button className="btn" onClick={() => setActive(prev.id)} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px', height: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="chevron-left" size={11}/> Previous</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{prev.label}</span>
              </button>
            ) : <div/>}
            {next ? (
              <button className="btn" onClick={() => setActive(next.id)} style={{ flexDirection: 'column', alignItems: 'flex-end', padding: '12px 16px', height: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 4 }}>Next <Icon name="chevron-right" size={11}/></span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{next.label}</span>
              </button>
            ) : <div/>}
          </div>
        </main>

        {/* Right rail */}
        <aside style={{ padding: '40px 24px', height: 'calc(100vh - 56px)', position: 'sticky', top: 56, overflow: 'auto', borderLeft: '1px solid var(--border-subtle)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>On this page</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--ink-3)', borderLeft: '2px solid var(--border-subtle)', paddingLeft: 12, marginBottom: 24 }}>
            <a style={{ cursor: 'pointer' }}>Overview</a>
            <a style={{ cursor: 'pointer', color: 'var(--brand)' }}>Quickstart</a>
            <a style={{ cursor: 'pointer' }}>Examples</a>
          </div>

          <div style={{ padding: 14, borderRadius: 8, background: 'var(--brand-soft)', border: '1px solid var(--brand-tint)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon name="sparkles" size={13} color="var(--brand-deep)"/>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Need help?</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10 }}>Ask Atlas Copilot in-app, or chat with a human on Pro+.</div>
            <button className="btn btn-sm btn-brand" style={{ width: '100%', justifyContent: 'center' }}>Open chat</button>
          </div>

          <div style={{ marginTop: 20, fontSize: 11, color: 'var(--ink-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Was this helpful?</span></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Yes</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>No</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};


