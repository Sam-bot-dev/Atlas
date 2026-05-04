/**
 * Insight Service
 * 
 * Generates context-aware reasoning using LLM (Groq)
 * Produces: "Why is this happening?" insights
 * 
 * Takes:
 * - Aggregated metrics
 * - Business context (location, type)
 * - Time patterns & seasonality
 * - Historical trends
 * 
 * Outputs: Evidence-backed insight cards
 */

const { prisma } = require('../lib/prisma');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate insights for a business
 * @param {string} businessId
 * @param {Object} metrics - calculated metrics from metricService
 * @returns {Promise<any[]>} insight cards
 */
async function generateInsights(businessId, metrics) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error('Business not found');

    // Gather context for the AI
    const context = await gatherBusinessContext(businessId, business, metrics);

    // Generate insights via LLM
    const insights = await generateInsightsViaLLM(context);

    // Save insights to database
    await saveInsights(businessId, insights);

    return insights;
  } catch (error) {
    console.error(`Error generating insights for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Gather all contextual data for the LLM
 * @param {string} businessId
 * @param {any} business
 * @param {any} metrics
 */
async function gatherBusinessContext(businessId, business, metrics) {
  const [orders, traffic, reviews, inventory, customers] = await Promise.all([
    prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.trafficPoint.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.review.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.inventoryItem.findMany({
      where: { businessId },
    }),
    prisma.customer.findMany({
      where: { businessId },
    }),
  ]);

  // Extract patterns
  const recentNegativeReviews = reviews.filter((/** @type {any} */ r) => r.rating <= 2);
  const lowStockItems = inventory.filter((/** @type {any} */ i) => i.quantityOnHand <= i.reorderPoint);

  // Get current time patterns
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMonth = now.getMonth();

  // Load goals (8.8)
  let goals = [];
  try {
    goals = JSON.parse(business.goals || '[]');
  } catch {
    // invalid JSON — default to empty goals
  }

   return {
     business: {
       id: businessId,
       name: business.name,
       type: business.category || 'Business',
       location: business.location || business.address || 'India',
       goals,
     },

    metrics,
    patterns: {
      recentOrderCount: orders.slice(0, 7).length,
      avgOrderValue:
        orders.length > 0
          ? Math.round(
              orders.reduce((/** @type {number} */ sum, /** @type {any} */ o) => sum + (o.total || 0), 0) /
                orders.length,
            )
          : 0,
      lowStockItemsCount: lowStockItems.length,
      negativeReviewsCount: recentNegativeReviews.length,
      totalCustomers: customers.length,
      repeatCustomerCount: customers.filter((/** @type {any} */ c) => c.ordersCount > 1).length,
      avgRating:
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((/** @type {number} */ sum, /** @type {any} */ r) => sum + r.rating, 0) / reviews.length) *
                10,
            ) / 10
          : 0,
    },
    timeContext: {
      currentHour,
      currentDay,
      currentMonth,
      season: getSeason(currentMonth),
      isDayOfWeek: getDayName(currentDay),
      isWeekend: currentDay === 0 || currentDay === 6,
    },
    recentIssues: {
      negativeReviews: recentNegativeReviews.slice(0, 3),
      lowStockItems: lowStockItems.slice(0, 3),
      trafficPatterns: traffic.slice(0, 10),
    },
    environmental: getMockEnvironmentalContext(business.location),
  };
}

/**
 * Simulates weather context based on location and current month
 * In a real app, this would call OpenWeatherMap API
 */
function getMockEnvironmentalContext(location = '') {
  const month = new Date().getMonth();
  const isSummer = month >= 2 && month <= 5;
  // Fix #53: month is 0-indexed; monsoon = June(5)–Sep(8), not 6–9
  const isMonsoon = month >= 5 && month <= 8;
  
  let temp = isSummer ? 38 : (isMonsoon ? 28 : 24);
  let condition = isSummer ? 'Sunny' : (isMonsoon ? 'Rainy' : 'Clear');
  
  // Fix #54: official spelling is 'bengaluru'; also keep 'bangalore' for legacy data
  const loc = location.toLowerCase();
  if (loc.includes('bengaluru') || loc.includes('bangalore')) temp -= 5;
  if (location.toLowerCase().includes('delhi') && isSummer) temp += 5;

  return {
    temp: `${temp}°C`,
    condition,
    impact: isSummer ? 'Heat affects afternoon foot traffic' : (isMonsoon ? 'Rain increases delivery demand' : 'Favorable conditions'),
  };
}

/**
 * Call Groq LLM to generate insights
 * @param {any} context
 */
async function generateInsightsViaLLM(context) {
  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not set. Using fallback insights.');
    return generateFallbackInsights(context);
  }

  try {
    const systemPrompt = `You are an AI business analyst for Indian SMBs. 
    Generate 3-5 specific, actionable insights explaining "WHY" business metrics are what they are.
    Base insights on:
    - Time patterns (day/hour/season)
    - Customer behavior
    - Inventory status
    - Review sentiment
    
    Return ONLY a valid JSON array of insight objects like:
    [
      {
        "title": "Short title",
        "body": "Detailed explanation (2-3 sentences)",
        "severity": "positive|negative|warning|info",
        "evidence": ["tag1", "tag2"]
      }
    ]`;

    const userPrompt = `\nBusiness: ${context.business.name} (${context.business.type})\nLocation: ${context.business.location}\nGoals: ${context.business.goals.join(', ') || 'General growth'}\n\nCurrent Metrics:\n- Revenue: ${context.metrics.revenue.value} (${context.metrics.revenue.delta > 0 ? '+' : ''}${context.metrics.revenue.delta}%)\n- Orders: ${context.metrics.orders.value} (${context.metrics.orders.delta > 0 ? '+' : ''}${context.metrics.orders.delta}%)\n- Conversion: ${context.metrics.conversion.value}%\n- Inventory Health: ${context.metrics.inventory.value}%\n- Customer Retention: ${context.metrics.retention.value}%\n- Review Sentiment: ${context.metrics.sentiment.value}/5\n\nContext:\n- Recent orders: ${context.patterns.recentOrderCount}\n- Avg order value: ₹${context.patterns.avgOrderValue}\n- Low stock items: ${context.patterns.lowStockItemsCount}\n- Negative reviews (recent): ${context.patterns.negativeReviewsCount}\n- Repeat customers: ${context.patterns.repeatCustomerCount}/${context.patterns.totalCustomers}\n\nTime: ${context.timeContext.isDayOfWeek}, ${getSeason(context.timeContext.currentMonth)}, ${context.timeContext.currentHour}:00\nEnvironmental: ${context.environmental.temp}, ${context.environmental.condition} (${context.environmental.impact})\n\nGenerate insights explaining why these metrics are at these levels, aligned with goals. Encourage taking advantage of favorable weather or mitigating negative weather impacts where applicable. Prioritize actions for ${context.business.goals.join(', ') || 'growth'}.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_INSIGHT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        // Fix #55: 1024 could truncate 5 detailed insights (~200 tok each). Use 2048.
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response — handle various LLM formatting quirks
    let insights = [];
    try {
      // 1. Try direct parse
      insights = JSON.parse(content);
    } catch {
      // 2. Try stripping markdown fences
      const stripped = content.replace(/```json|```/g, '').trim();
      try {
        insights = JSON.parse(stripped);
      } catch {
        // 3. Try regex extraction for the first array
        const jsonMatch = stripped.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            insights = JSON.parse(jsonMatch[0]);
          } catch {
            throw new Error('LLM returned invalid JSON structure');
          }
        } else {
          throw new Error('Could not find JSON array in LLM response');
        }
      }
    }
    
    // Ensure we always return an array
    const finalInsights = Array.isArray(insights) ? insights : [insights];
    
    // Fix #10: Validate insight objects before returning
    return finalInsights.filter(i => i && i.title && i.body).map(i => ({
      title: String(i.title).substring(0, 100),
      body: String(i.body).substring(0, 500),
      severity: ['positive', 'negative', 'warning', 'info'].includes(i.severity) ? i.severity : 'info',
      evidence: Array.isArray(i.evidence) ? i.evidence.map((/** @type {any} */ e) => String(e).substring(0, 30)) : [],
    }));
  } catch (error) {
    console.error('LLM insight generation error:', error);
    return generateFallbackInsights(context);
  }
}

/**
 * Fallback insights when LLM is unavailable
 * @param {any} context
 */
function generateFallbackInsights(context) {
  const insights = [];
  const { metrics, patterns, timeContext, recentIssues } = context;

// Insight 1: Revenue trend
   if (Math.abs(metrics.revenue.delta) >= 5) {
     insights.push({
       title: metrics.revenue.delta > 0 ? 'Revenue Growing Strong' : 'Revenue Decline Detected',
       body: metrics.revenue.delta > 0
         ? `Your revenue increased by ${metrics.revenue.delta}% this month. Strong customer demand is driving sales.`
         : `Revenue dropped ${Math.abs(metrics.revenue.delta)}% this month. Consider seasonal factors or reduced marketing reach.`,
       severity: metrics.revenue.delta > 0 ? 'positive' : 'negative',
       evidence: metrics.revenue.delta > 0 ? ['revenue_surge', 'growth_trend'] : ['revenue_drop', 'low_orders'],
     });
   } else {
     // Fix #72: Always show a revenue insight for normal days (within ±15%)
     insights.push({
       title: 'Revenue Stable',
       body: `Your revenue is stable with ${metrics.revenue.delta}% change. Business conditions are consistent with recent trends.`,
       severity: 'info',
       evidence: ['stable_revenue', 'normal_performance'],
     });
   }

  // Insight 2: Inventory
  if (recentIssues.lowStockItems.length > 2) {
    insights.push({
      title: 'Low Stock Alert',
      body: `${recentIssues.lowStockItems.length} items are below reorder point. Urgent restocking needed to avoid stockouts.`,
      severity: 'warning',
      evidence: ['inventory_low', 'reorder_needed'],
    });
  }

  // Insight 3: Customer satisfaction
  if (recentIssues.negativeReviews.length > 0) {
    insights.push({
      title: 'Negative Customer Feedback',
      body: `${recentIssues.negativeReviews.length} recent low-rating reviews detected. Review and address customer pain points.`,
      severity: 'warning',
      evidence: ['negative_sentiment', 'customer_complaint'],
    });
  } else if (patterns.avgRating >= 4) {
    insights.push({
      title: 'Strong Customer Satisfaction',
      body: `Your average rating is ${patterns.avgRating}/5. Keep up the quality service to maintain customer loyalty.`,
      severity: 'positive',
      evidence: ['positive_sentiment', 'high_rating'],
    });
  }

  // Insight 4: Conversion
  if (metrics.conversion.value < 1) {
    insights.push({
      title: 'Conversion Rate Below Average',
      body: `Only ${metrics.conversion.value}% of visitors convert to customers. Consider improving marketing message or checkout process.`,
      severity: 'info',
      evidence: ['low_conversion', 'traffic_optimization_needed'],
    });
  }

  // Insight 5: Time-based insight
  if (timeContext.isWeekend && patterns.recentOrderCount < 2) {
    insights.push({
      title: 'Weekend Slowdown',
      body: `Low order volume on ${timeContext.isDayOfWeek}. Consider weekend promotions or special offers.`,
      severity: 'info',
      evidence: ['weekend_pattern', 'low_traffic'],
    });
  }

  return insights.slice(0, 5);
}

/**
 * Save insights to the database
 * @param {string} businessId
 * @param {any[]} insights
 */
async function saveInsights(businessId, insights) {
  // Delete only regular insights, preserve anomalies
  await prisma.insight.deleteMany({
    where: { 
      businessId,
      type: "regular"
    },
  });

  // Save new regular insights
  for (const insight of insights) {
    await prisma.insight.create({
      data: {
        businessId,
        title: insight.title,
        body: insight.body,
        severity: insight.severity || 'info',
        type: "regular",
        evidence: JSON.stringify(insight.evidence || []),
      },
    });
  }
}

/**
 * Get season from month
 * @param {number} month
 */
function getSeason(month) {
  // India-specific seasons
  if (month >= 2 && month <= 4) return 'Summer';
  if (month >= 5 && month <= 9) return 'Monsoon';
  if (month >= 10 && month <= 11) return 'Post-Monsoon';
  return 'Winter';
}

/**
 * Get day name
 * @param {number} dayOfWeek
 */
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

/**
 * Sanitize user input to prevent prompt injection
 * Removes attempts to override system instructions or inject malicious content
 * @param {string} query
 */
function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return '';

  let clean = query.trim();

  // Limit length to prevent abuse (max 500 chars)
  if (clean.length > 500) {
    clean = clean.substring(0, 500);
  }

  // Block common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(the\s+)?(above|previous)/i,
    /system\s*:/i,
    /role\s*:/i,
    /you\s+are\s+now/i,
    /new\s+system\s+prompt/i,
    /<\/?system>/i,
    /<\/?role>/i,
    /override/i,
    /bypass/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(clean)) {
      console.warn('Prompt injection attempt detected and blocked:', clean.substring(0, 100));
      return 'Invalid query detected. Please ask a business question.';
    }
  }

  return clean;
}

/**
 * Answer a user query about their business using LLM
 * @param {string} businessId
 * @param {string} query
 */
async function askAtlas(businessId, query) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { metrics: true, insights: true }
    });

    if (!business) throw new Error('Business not found');

     // Fix #96: sanitize user input to prevent prompt injection
     const safeQuery = sanitizeQuery(query);
     if (!safeQuery) {
       return { answer: "I couldn't understand that query. Please rephrase your question.", isFallback: true };
     }

    // Fix #99: askAtlas was passing raw Metric[] objects (from DB) while generateInsights
    // passes pre-calculated summary values. Normalize to the same { value, delta, label } shape.
    const metricsMap = business.metrics.reduce((/** @type {any} */ acc, /** @type {any} */ m) => ({
      ...acc,
      [m.key]: { value: m.value, delta: m.delta, label: m.label || m.key, unit: m.unit || '', period: m.period || '' }
    }), {});
    const context = await gatherBusinessContext(businessId, business, metricsMap);

    if (!GROQ_API_KEY) {
      return { 
        answer: "I'm currently in offline mode. Based on your metrics, I can see you have " + 
        (metricsMap.revenue ? `₹${metricsMap.revenue.value} revenue` : "some activity") + 
        ". Connect my brain (GROQ_API_KEY) for full AI reasoning!",
        isFallback: true 
      };
    }

    const systemPrompt = `You are Atlas, a genius AI Business Partner for Indian SMBs. 
    You have full access to the business's data, metrics, and context.
    Your tone is professional, encouraging, and highly data-driven.
    Answer the user's question specifically using their metrics. 
    If they ask about weather or competition, use the provided context.
    Keep answers concise but high-value (max 4 sentences).`;

    const userPrompt = `
Business: ${context.business.name} (${context.business.type})
Location: ${context.business.location}
Current Metrics: Revenue ${context.metrics.revenue?.unit || ''}${context.metrics.revenue?.value ?? 0} (${context.metrics.revenue?.delta >= 0 ? '+' : ''}${context.metrics.revenue?.delta ?? 0}%), Orders ${context.metrics.orders?.value ?? 0} (${context.metrics.orders?.delta >= 0 ? '+' : ''}${context.metrics.orders?.delta ?? 0}%), Retention ${context.metrics.retention?.value ?? 0}%
Patterns: Avg Order ₹${context.patterns.avgOrderValue}, Repeat Customers ${context.patterns.repeatCustomerCount}/${context.patterns.totalCustomers}, Avg Rating ${context.patterns.avgRating}/5
Recent Issues: ${context.recentIssues.lowStockItems.length} low stock, ${context.recentIssues.negativeReviews.length} negative reviews
Environment: ${context.environmental.temp}, ${context.environmental.condition} (${context.environmental.impact})
Recent Insights: ${business.insights.map((/** @type {any} */ i) => i.title).join(', ')}

User Question: "${safeQuery}"

Provide a data-backed answer as Atlas. Reference specific numbers from the metrics above where relevant.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_INSIGHT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 512,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);

    const data = await response.json();
    return { 
      answer: data.choices[0].message.content,
      isFallback: false 
    };
  } catch (error) {
    console.error('Atlas Ask Error:', error);
    return { 
      answer: "I'm having trouble connecting to my reasoning engine. Please try again in a moment.",
      isFallback: true 
    };
  }
}

/**
 * Public version of askAtlas — accepts a full business object instead of a DB ID.
 * Used by the public /api/v1/ask endpoint so demo businesses (no DB record) can
 * also query the AI with their full client-side context passed in the request body.
 *
 * @param {object} business - full business object (from client, may be demo data)
 * @param {string} query
 */
async function publicAskAtlas(business, query) {
  const safeQuery = sanitizeQuery(query);
  if (!safeQuery) {
    return { answer: "I couldn't understand that query. Please rephrase your question.", isFallback: true };
  }

  // Build a lightweight context from the passed business object
  const metrics = business.metrics && typeof business.metrics === 'object' && !Array.isArray(business.metrics)
    ? business.metrics
    : {};

  const environmental = getMockEnvironmentalContext(business.location || business.address || '');

  const insightTitles = Array.isArray(business.insights)
    ? business.insights.map(i => i.title).filter(Boolean).join(', ')
    : '';

  if (!GROQ_API_KEY) {
    return {
      answer: "I'm currently in offline mode. Connect my brain (GROQ_API_KEY) for full AI reasoning!",
      isFallback: true,
    };
  }

  try {
    const systemPrompt = `You are Atlas, a genius AI Business Partner for Indian SMBs.
    You have access to the business's data, metrics, and context.
    Your tone is professional, encouraging, and highly data-driven.
    Answer the user's question specifically using their metrics.
    Keep answers concise but high-value (max 4 sentences).`;

    const userPrompt = `
Business: ${business.name || 'Business'} (${business.category || business.type || 'Business'})
Location: ${business.location || business.address || 'India'}
Current Metrics: Revenue ${metrics.revenue?.unit || '\u20b9'}${metrics.revenue?.value ?? 0} (${metrics.revenue?.delta >= 0 ? '+' : ''}${metrics.revenue?.delta ?? 0}%), Orders ${metrics.orders?.value ?? 0}, Retention ${metrics.retention?.value ?? 0}%
Environment: ${environmental.temp}, ${environmental.condition} (${environmental.impact})
Recent Insights: ${insightTitles || 'None yet'}

User Question: "${safeQuery}"

Provide a data-backed answer as Atlas. Reference specific numbers where relevant.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_INSIGHT_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 512,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);

    const data = await response.json();
    return {
      answer: data.choices[0].message.content,
      isFallback: false,
    };
  } catch (error) {
    console.error('Atlas publicAsk Error:', error);
    return {
      answer: "I'm having trouble connecting to my reasoning engine. Please try again in a moment.",
      isFallback: true,
    };
  }
}

module.exports = {
  generateInsights,
  gatherBusinessContext,
  generateInsightsViaLLM,
  generateFallbackInsights,
  askAtlas,
  publicAskAtlas,
};
