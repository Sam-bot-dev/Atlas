/* eslint-env node */
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { normalizeExtraction } = require('../lib/ingestion/normalize');
const { calculateMetrics, saveMetrics } = require('../services/metricService');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ensureBusiness = async (req, res) => {
  const biz = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!biz) { res.status(404); throw new Error('Business not found'); }
  return biz;
};

// Extract structured data from a natural language message
const extractFromMessage = async (message, business) => {
  if (!GROQ_API_KEY) return null;

  const schema = `Return JSON only:
{
  "orders": [{"externalId":"","orderDate":"YYYY-MM-DD","customerName":"","productName":"","quantity":0,"unitPrice":0,"total":0,"channel":"chat"}],
  "customers": [{"externalId":"","name":"","phone":"","email":"","ordersCount":0,"totalSpend":0,"segment":""}],
  "reviews": [{"platform":"chat","rating":0,"body":"","sentiment":"positive|neutral|negative","reviewDate":"YYYY-MM-DD"}],
  "inventory": [{"sku":"","itemName":"","quantityOnHand":0,"reorderPoint":0,"status":"ok|low|out"}],
  "products": [{"sku":"","name":"","category":"","unitsSold":0,"revenue":0,"quantityOnHand":0,"reorderPoint":0}],
  "traffic": []
}
Only include arrays that have data. Use today's date if no date mentioned. Return empty arrays for types not mentioned.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `You extract Indian SMB business data from casual messages into strict JSON. Business: ${business.name} (${business.category}). Today: ${new Date().toISOString().split('T')[0]}. ${schema}` },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    // Ensure all arrays exist
    return {
      orders: parsed.orders || [],
      customers: parsed.customers || [],
      reviews: parsed.reviews || [],
      inventory: parsed.inventory || [],
      products: parsed.products || [],
      traffic: parsed.traffic || [],
    };
  } catch {
    return null;
  }
};

// Generate a conversational reply acknowledging what was stored
const generateReply = async (message, extracted, business, history) => {
  if (!GROQ_API_KEY) {
    const total = Object.values(extracted || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
    return total > 0
      ? `Got it! I've recorded that in your business data. ${total} record(s) saved.`
      : `I heard you, but couldn't find specific data to record. Try mentioning things like sales amounts, customer names, or product quantities.`;
  }

  const stored = [];
  if (extracted?.orders?.length) stored.push(`${extracted.orders.length} order(s)`);
  if (extracted?.customers?.length) stored.push(`${extracted.customers.length} customer(s)`);
  if (extracted?.reviews?.length) stored.push(`${extracted.reviews.length} review(s)`);
  if (extracted?.inventory?.length) stored.push(`${extracted.inventory.length} inventory item(s)`);
  if (extracted?.products?.length) stored.push(`${extracted.products.length} product(s)`);

  const recentHistory = history.slice(-6).map(m => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You are Atlas, a friendly AI business assistant for ${business.name}. 
The user is telling you about their business activity in a casual WhatsApp-style chat.
${stored.length > 0 ? `You just stored: ${stored.join(', ')} in their records.` : 'No structured data was found in this message.'}
Respond naturally and briefly (1-2 sentences). Acknowledge what was recorded if anything. 
If nothing was recorded, gently ask for more specific info (amounts, names, quantities).
Never mention JSON, databases, or technical terms.`,
          },
          ...recentHistory,
          { role: 'user', content: message },
        ],
      }),
    });
    if (!res.ok) throw new Error('Groq error');
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Got it, noted!';
  } catch {
    return stored.length > 0
      ? `Saved! Recorded ${stored.join(' and ')} in your records.`
      : `Got it. Tell me more details like amounts or customer names so I can record it properly.`;
  }
};

// GET /businesses/:bizId/chat — load history
const getMessages = asyncHandler(async (req, res) => {
  await ensureBusiness(req, res);
  const messages = await prisma.chatMessage.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json(messages);
});

// POST /businesses/:bizId/chat — send message
const sendMessage = asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req, res);
  const content = String(req.body.message || '').trim();
  if (!content) { res.status(400); throw new Error('message is required'); }

  // Save user message
  await prisma.chatMessage.create({
    data: { businessId: business.id, role: 'user', content, extracted: '{}' },
  });

  // Load recent history for context
  const history = await prisma.chatMessage.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  history.reverse();

  // Extract structured data from the message
  const extracted = await extractFromMessage(content, business);
  const hasData = extracted && Object.values(extracted).some(arr => arr?.length > 0);

  // If data was extracted, create a chat data source and normalize
  if (hasData) {
    try {
      // Find or create a "chat" data source for this business
      let chatSource = await prisma.dataSource.findFirst({
        where: { businessId: business.id, type: 'chat' },
      });
      if (!chatSource) {
        chatSource = await prisma.dataSource.create({
          data: { businessId: business.id, type: 'chat', name: 'AI Chat', status: 'complete' },
        });
      }
      await normalizeExtraction({ businessId: business.id, sourceId: chatSource.id, extraction: extracted });
    } catch (err) {
      console.warn('[chat] normalize failed (non-fatal):', err.message);
    }
  }

  // Generate reply
  const reply = await generateReply(content, extracted, business, history);

  // Save assistant reply
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      businessId: business.id,
      role: 'assistant',
      content: reply,
      extracted: JSON.stringify(extracted || {}),
    },
  });

  res.json({
    message: assistantMsg,
    extracted: extracted || {},
    stored: hasData,
  });
});

// DELETE /businesses/:bizId/chat — clear history
const clearMessages = asyncHandler(async (req, res) => {
  await ensureBusiness(req, res);
  await prisma.chatMessage.deleteMany({ where: { businessId: req.params.bizId } });
  res.json({ cleared: true });
});

module.exports = { getMessages, sendMessage, clearMessages };
