const { validateExtraction } = require('./schema');
const { fallbackExtract } = require('./fallbackExtractor');

const schemaHint = `Return JSON only with keys:
{
  "orders": [{"externalId":"","orderDate":"YYYY-MM-DD or null","customerName":"","customerPhone":"","productName":"","quantity":0,"unitPrice":0,"total":0,"channel":""}],
  "products": [{"sku":"","name":"","category":"","unitsSold":0,"revenue":0,"quantityOnHand":0,"reorderPoint":0}],
  "customers": [{"externalId":"","name":"","phone":"","email":"","ordersCount":0,"totalSpend":0,"segment":""}],
  "reviews": [{"platform":"","rating":0,"body":"","sentiment":"positive|neutral|negative","reviewDate":"YYYY-MM-DD or null"}],
  "inventory": [{"sku":"","itemName":"","quantityOnHand":0,"reorderPoint":0,"status":"ok|low|out"}],
  "traffic": [{"occurredAt":"YYYY-MM-DD or null","channel":"","visitors":0,"conversions":0}]
}`;

const extractJson = (text) => {
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
};

const groqExtract = async ({ rawText, rows, business }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const sourceText = rawText || JSON.stringify(rows || []);
  if (!sourceText.trim()) return null;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You extract Indian SMB business data into strict JSON. Preserve INR values as numbers. ${schemaHint}`,
        },
        {
          role: 'user',
          content: `Business: ${business.name} (${business.category || business.type || 'SMB'}). Raw input:\n${sourceText.slice(0, 14000)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq extraction failed: ${body.slice(0, 240)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return validateExtraction(extractJson(content));
};

const extractStructuredData = async (context) => {
  const llmResult = await groqExtract(context);
  if (llmResult) return { data: llmResult, provider: 'groq' };

  return {
    data: fallbackExtract(context),
    provider: 'deterministic',
  };
};

module.exports = { extractStructuredData };
