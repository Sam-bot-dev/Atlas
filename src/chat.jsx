import React from 'react';
import { Icon } from './ui';
import { AtlasAPI } from './api';

// Per-business chat history — survives panel close/reopen within the session
const chatHistory = {};

export const ChatPanel = ({ business, onClose }) => {
  const bizKey = business?.id || 'default';
  const [messages, setMessages] = React.useState(() => {
    if (chatHistory[bizKey]) return chatHistory[bizKey];
    return [{ role: 'assistant', content: `Hello! I'm Atlas. I've analyzed **${business.name}**. What would you like to know?`, timestamp: new Date() }];
  });
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Reset when switching businesses
  React.useEffect(() => {
    if (chatHistory[bizKey]) {
      setMessages(chatHistory[bizKey]);
    } else {
      const welcome = [{ role: 'assistant', content: `Hello! I'm Atlas. I've analyzed **${business.name}**. What would you like to know?`, timestamp: new Date() }];
      setMessages(welcome);
      chatHistory[bizKey] = welcome;
    }
  }, [bizKey, business.name]);

  // Persist messages to session cache
  React.useEffect(() => {
    chatHistory[bizKey] = messages;
  }, [messages, bizKey]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-focus input on open
  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = async (text) => {
    const q = (text || query).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await AtlasAPI.insights.askWithContext(q, business);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        evidence: res.evidence,
        timestamp: new Date()
      }]);
    } catch (err) {
      void err;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(query);
  };

  // Suggested questions per business type
  const suggestions = {
    'Home Baker': ['What drove revenue this week?', 'Which product has the best margin?', 'When are my busiest hours?'],
    'Retail Shop': ['Which SKUs should I reorder?', 'Why did foot traffic drop?', 'What is my best-selling category?'],
    'Pharmacy': ['Which refills are due this week?', 'What is my inventory health?', 'How is customer retention?'],
    'Cafe': ['What is my peak hour today?', 'How can I reduce milk waste?', 'Which items drive repeat visits?'],
    'Import/Export': ['Which shipments are at risk?', 'What is my on-time delivery rate?', 'Which clients need follow-up?'],
    'Service Business': ['Which jobs have the best margin?', 'How many leads are active?', 'What is my conversion rate?'],
  };
  const quickQuestions = suggestions[business?.category] || suggestions['Home Baker'];
  const showSuggestions = messages.length <= 1;

  return (
    <div className="fade-in" style={{
      position: 'fixed', right: 24, bottom: 24, width: 400, height: 600,
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--ink-1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="zap" size={14} strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ask Atlas</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>AI Business Assistant</div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><Icon name="x" size={18}/></button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.5,
              background: m.role === 'user' ? 'var(--ink-1)' : 'var(--bg-subtle)',
              color: m.role === 'user' ? 'white' : 'var(--ink-1)',
              borderBottomRightRadius: m.role === 'user' ? 2 : 12,
              borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
            }}>
              {m.content.split('\n').map((line, idx) => (
                <p key={idx} style={{ margin: 0, marginBottom: line ? 8 : 0 }}>
                  {line.split(/(\*\*.*?\*\*)/).map((part, pidx) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={pidx}>{part.slice(2, -2)}</strong> 
                      : part
                  )}
                </p>
              ))}
              {m.evidence && m.evidence.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {m.evidence.map((e, ei) => (
                    <span key={ei} className="badge" style={{ fontSize: 10, background: 'var(--bg-elevated)' }}>{e}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {/* Quick suggestions — only shown before first user message */}
        {showSuggestions && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                  cursor: 'pointer', color: 'var(--ink-2)',
                  transition: 'background 120ms',
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
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 12, borderBottomLeftRadius: 2 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(dot => (
                <div key={dot} className="dot-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-4)', animationDelay: `${dot * 150}ms` }}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            className="input"
            placeholder={`Ask about ${business?.name || 'your business'}…`}
            style={{ paddingRight: 48, borderRadius: 12, height: 44, background: 'var(--bg-elevated)' }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: 6, top: 6, bottom: 6, padding: 8, borderRadius: 8 }} disabled={!query.trim() || loading}>
            <Icon name="arrow-up" size={16}/>
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center', marginTop: 8 }}>
          Atlas AI · responses may not always be accurate
        </div>
      </form>
    </div>
  );
};
