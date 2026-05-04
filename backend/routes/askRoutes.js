const express = require('express');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Stricter rate limit — no auth on this endpoint
const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
});

// Block prompt injection attempts, cap length
function sanitize(str) {
  if (!str || typeof str !== 'string') return '';
  const s = str.trim().slice(0, 600);
  const bad = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(the\s+)?(above|previous)/i,
    /you\s+are\s+now/i,
    /new\s+system\s+prompt/i,
    /<\/?system>/i,
    /\boverride\b/i,
    /\bbypass\b/i,
  ];
  for (const p of bad) {
    if (p.test(s)) return '';
  }
  return s;
}

// Build a rich system prompt from whatever business context the frontend sends.
// Handles both demo objects (full rich shape) and real DB objects (metrics as array).
function buildSystemPrompt(biz) {
  const name     = biz.name     || 'this business';
  const category = biz.category || 'Business';
  const location = biz.location || biz.address || 'India';
  const owner    = biz.owner    || 'Owner';

  // Metrics — demo sends { revenue: { value, delta, label, unit }, ... }
  //           real DB may send an array of { key, value, delta, label, unit }
  let metricLines = '';
  if (Array.isArray(biz.metrics)) {
    metricLines = biz.metrics.map(m =>
      `  ${m.label || m.key}: ${m.unit === '₹' ? '₹' : ''}${(m.value || 0).toLocaleString('en-IN')}${m.unit && m.unit !== '₹' ? m.unit : ''} (${m.delta >= 0 ? '+' : ''}${m.delta ?? 0}%)`
    ).join('\n');
  } else if (biz.metrics && typeof biz.metrics === 'object') {
    metricLines = Object.entries(biz.metrics).map(([k, m]) =>
      `  ${m.label || k}: ${m.unit === '₹' ? '₹' : ''}${(m.value || 0).toLocaleString('en-IN')}${m.unit && m.unit !== '₹' ? m.unit : ''} (${m.delta >= 0 ? '+' : ''}${m.delta ?? 0}%)`
    ).join('\n');
  }

  // Insights
  const insightLines = (biz.insights || []).slice(0, 6).map(i =>
    `  [${i.severity || 'info'}] ${i.title}: ${i.body}`
  ).join('\n');

  // Actions
  const actionLines = (biz.actions || []).slice(0, 5).map(a =>
    `  • ${a.title} — Impact: ${a.impact || 'N/A'}, Effort: ${a.effort || 'N/A'}\n    ${a.body || ''}`
  ).join('\n');

  // Top movers (demo only — real accounts may not have this)
  const moverLines = (biz.topMovers || []).slice(0, 5).map(([n, u, d]) =>
    `  ${n}: ${u} units (${d >= 0 ? '+' : ''}${d}%)`
  ).join('\n');

  // Spending mix
  const spendLines = (biz.spendingMix || []).map(s =>
    `  ${s.label}: ₹${(s.value || 0).toLocaleString('en-IN')}`
  ).join('\n');

  // Peak hours summary — find busiest day
  const peakHours = biz.peakHours || [];
  let peakDaySummary = '';
  if (peakHours.length) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const totals = peakHours.map(row => row.reduce((s, v) => s + v, 0));
    const peakIdx = totals.indexOf(Math.max(...totals));
    peakDaySummary = `  Busiest day: ${days[peakIdx] || 'Saturday'} (peak activity 9 AM – 12 PM)`;
  }

  return `You are Atlas, an expert AI business partner for Indian SMBs. You have complete, real-time knowledge of the business below. Answer every question using the specific numbers and facts provided — never invent data. Be concise (3–5 sentences), direct, and actionable.

BUSINESS
  Name: ${name}
  Type: ${category}
  Location: ${location}
  Owner: ${owner}

METRICS
${metricLines || '  No metrics available.'}

TOP SELLING ITEMS
${moverLines || '  No data.'}

SPENDING MIX
${spendLines || '  No data.'}

TRAFFIC PATTERNS
${peakDaySummary || '  No data.'}

ACTIVE INSIGHTS
${insightLines || '  No insights yet.'}

RECOMMENDED ACTIONS
${actionLines || '  No actions yet.'}

RULES
- Use only the data above. Never fabricate numbers.
- If the question is outside this data, say what you do know and what data would help.
- Match the language the user writes in.
- Keep answers under 5 sentences unless a list is clearly better.`;
}

// POST /api/v1/ask  — public, no auth required
router.post('/', askLimiter, async (req, res) => {
  try {
    const { query, business } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'query is required' });
    }
    if (!business || !business.name) {
      return res.status(400).json({ message: 'business context is required' });
    }

    const safeQuery = sanitize(query);
    if (!safeQuery) {
      return res.json({ answer: 'Please ask a valid business question.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const rev = Array.isArray(business.metrics)
        ? business.metrics.find(m => m.key === 'revenue')
        : business.metrics?.revenue;
      return res.json({
        answer: `I can see ${business.name} has ₹${(rev?.value || 0).toLocaleString('en-IN')} in revenue this period. Add GROQ_API_KEY to backend/.env to unlock full AI reasoning.`,
        isFallback: true,
      });
    }

    const systemPrompt = buildSystemPrompt(business);

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: safeQuery },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => groqRes.statusText);
      console.error('[ask] Groq error:', groqRes.status, errText);
      return res.status(502).json({ message: 'AI service unavailable. Please try again shortly.' });
    }

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || 'No response generated.';

    return res.json({ answer, isFallback: false });
  } catch (err) {
    console.error('[ask] Unexpected error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
