import React from 'react';
import { Icon } from './ui';
import { AtlasAPI } from './api';

// Per-business chat history — survives panel close/reopen within the session
const chatHistory = {};

const DEMO_IDS = ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'];

// Build a rich context object from all available business data
const buildFullContext = async (business) => {
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;
  if (isDemo) return business; // demo already has everything in the object

  try {
    // Fetch records and business details in parallel
    const [records] = await Promise.all([
      AtlasAPI.records.list(business.id).catch(() => null),
    ]);

    return {
      ...business,
      _records: records ? {
        orderCount: records.orders?.length || 0,
        totalRevenue: (records.orders || []).reduce((s, o) => s + (o.total || 0), 0),
        topProducts: (records.products || []).sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => ({ name: p.name, revenue: p.revenue, sold: p.unitsSold })),
        customerCount: records.customers?.length || 0,
        topCustomers: (records.customers || []).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5).map(c => ({ name: c.name, spend: c.totalSpend, orders: c.ordersCount })),
        lowStock: (records.inventory || []).filter(i => i.status === 'low' || i.status === 'out').map(i => ({ item: i.itemName, qty: i.quantityOnHand, reorder: i.reorderPoint })),
        recentReviews: (records.reviews || []).slice(0, 10).map(r => ({ rating: r.rating, sentiment: r.sentiment, body: r.body?.slice(0, 80) })),
        avgRating: records.reviews?.length ? (records.reviews.reduce((s, r) => s + r.rating, 0) / records.reviews.length).toFixed(1) : null,
      } : null,
    };
  } catch {
    return business;
  }
};

export const ChatPanel = ({ business, onClose }) => {
  const bizKey = business?.id || 'default';
  const isDemo = DEMO_IDS.includes(business?.id) || business?.isDemo;

  const [messages, setMessages] = React.useState(() => {
    if (chatHistory[bizKey]) return chatHistory[bizKey];
    return [{
      role: 'assistant',
      content: `Hi! I'm Atlas, your AI business partner for **${business?.name}**. I know your records, metrics, insights, and actions. Ask me anything.`,
      timestamp: new Date(),
    }];
  });
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fullContext, setFullContext] = React.useState(null);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Load full context once on open
  React.useEffect(() => {
    buildFullContext(business).then(setFullContext);
  }, [bizKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (chatHistory[bizKey]) {
      setMessages(chatHistory[bizKey]);
    } else {
      const welcome = [{
        role: 'assistant',
        content: `Hi! I'm Atlas, your AI business partner for **${business?.name}**. I know your records, metrics, insights, and actions. Ask me anything.`,
        timestamp: new Date(),
      }];
      setMessages(welcome);
      chatHistory[bizKey] = welcome;
    }
  }, [bizKey, business?.name]);

  React.useEffect(() => { chatHistory[bizKey] = messages; }, [messages, bizKey]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSend = async (text) => {
    const q = (text || query).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: q, timestamp: new Date() }]);
    setQuery('');
    setLoading(true);

    try {
      const ctx = fullContext || business;
      const res = await AtlasAPI.insights.askWithContext(q, ctx);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        evidence: res.evidence,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = {
    'Home Baker':       ['What drove revenue this week?', 'Which product has the best margin?', 'Who are my top customers?'],
    'Retail Shop':      ['Which SKUs should I reorder?', 'Why did foot traffic drop?', 'What is my best-selling category?'],
    'Pharmacy':         ['Which refills are due this week?', 'What is my inventory health?', 'How is customer retention?'],
    'Cafe':             ['What is my peak hour today?', 'How can I reduce waste?', 'Which items drive repeat visits?'],
    'Import/Export':    ['Which shipments are at risk?', 'What is my on-time delivery rate?', 'Which clients need follow-up?'],
    'Service Business': ['Which jobs have the best margin?', 'How many leads are active?', 'What is my conversion rate?'],
    'Restaurant':       ['What are my top dishes?', 'When is my busiest time?', 'How are my reviews trending?'],
  };
  const quickQuestions = suggestions[business?.category] || suggestions['Home Baker'];
  const showSuggestions = messages.length <= 1;

  return (
    <div className="fade-in" style={{
      position: 'fixed', right: 24, bottom: 24, width: 400, height: 600,
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink-1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={15} strokeWidth={2}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Atlas AI</div>
            <div style={{ fontSize: 11, color: 'var(--positive)' }}>
              {fullContext?._records ? `● ${fullContext._records.orderCount} orders · ${fullContext._records.customerCount} customers loaded` : '● Connected'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>⌘K</span>
          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.55,
              background: m.role === 'user' ? 'var(--ink-1)' : 'var(--bg-subtle)',
              color: m.role === 'user' ? 'white' : 'var(--ink-1)',
              borderBottomRightRadius: m.role === 'user' ? 2 : 12,
              borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
            }}>
              {m.content.split('\n').map((line, idx) => (
                <p key={idx} style={{ margin: 0, marginBottom: idx < m.content.split('\n').length - 1 ? 6 : 0 }}>
                  {line.split(/(\*\*.*?\*\*)/).map((part, pidx) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={pidx}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {showSuggestions && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} style={{
                textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--ink-2)', transition: 'background 120ms',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 12, borderBottomLeftRadius: 2 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(dot => (
                <div key={dot} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-4)', animation: `bounce 1s ${dot * 0.15}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            className="input"
            placeholder={`Ask about ${business?.name || 'your business'}…`}
            style={{ paddingRight: 48, borderRadius: 10, height: 42, background: 'var(--bg-elevated)', fontSize: 13 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(query); } }}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            style={{ position: 'absolute', right: 5, top: 5, bottom: 5, padding: '0 10px', borderRadius: 7 }}
            disabled={!query.trim() || loading}
            onClick={() => handleSend(query)}
          >
            <Icon name="arrow-up" size={15}/>
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center', marginTop: 6 }}>
          Atlas AI · knows your records, metrics & insights
        </div>
      </div>
    </div>
  );
};
