import React from 'react';
import { Icon, AtlasLogo } from './ui';
import { AtlasAPI } from './api';

export const ChatPanel = ({ business, onClose }) => {
  React.useEffect(() => {
    setMessages([{ role: 'assistant', content: `Hello! I'm Atlas. I've analyzed **${business.name}**. What would you like to know?`, timestamp: new Date() }]);
  }, [business.id]);
  const [query, setQuery] = React.useState('');
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: `Hello! I'm Atlas. I've analyzed **${business.name}**. What would you like to know?`, timestamp: new Date() }
  ]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await AtlasAPI.insights.ask(business.id, { query, context: messages });
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: res.answer, 
        evidence: res.evidence,
        timestamp: new Date() 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to my brain right now. Please try again in a moment.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    };
  };

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
              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
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
      <form onSubmit={handleSend} style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <input 
            className="input" 
            placeholder="Ask about revenue, staff, or strategy..." 
            style={{ paddingRight: 48, borderRadius: 12, height: 44, background: 'var(--bg-elevated)' }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: 6, top: 6, bottom: 6, padding: 8, borderRadius: 8 }} disabled={!query.trim() || loading}>
            <Icon name="arrow-up" size={16}/>
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center', marginTop: 12 }}>
          Atlas AI can make mistakes. Check important info.
        </div>
      </form>
    </div>
  );
};
