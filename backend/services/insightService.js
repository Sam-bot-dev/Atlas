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
 * @returns {Promise<Array>} insight cards
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
  const recentNegativeReviews = reviews.filter((r) => r.rating <= 2);
  const lowStockItems = inventory.filter((i) => i.quantityOnHand <= i.reorderPoint);

  // Get current time patterns
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMonth = now.getMonth();

  return {
    business: {
      id: businessId,
      name: business.name,
      type: business.type || business.category || 'Business',
      location: business.location || business.address || 'India',
      category: business.category,
    },
    metrics,
    patterns: {
      recentOrderCount: orders.slice(0, 7).length,
      avgOrderValue:
        orders.length > 0
          ? Math.round(
              orders.reduce((sum, o) => sum + (o.total || 0), 0) /
                orders.length,
            )
          : 0,
      lowStockItemsCount: lowStockItems.length,
      negativeReviewsCount: recentNegativeReviews.length,
      totalCustomers: customers.length,
      repeatCustomerCount: customers.filter((c) => c.ordersCount > 1).length,
      avgRating:
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
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
  const isMonsoon = month >= 6 && month <= 9;
  
  let temp = isSummer ? 38 : (isMonsoon ? 28 : 24);
  let condition = isSummer ? 'Sunny' : (isMonsoon ? 'Rainy' : 'Clear');
  
  if (location.toLowerCase().includes('bangalore')) temp -= 5;
  if (location.toLowerCase().includes('delhi') && isSummer) temp += 5;

  return {
    temp: `${temp}°C`,
    condition,
    impact: isSummer ? 'Heat affects afternoon foot traffic' : (isMonsoon ? 'Rain increases delivery demand' : 'Favorable conditions'),
  };
}

/**
 * Call Groq LLM to generate insights
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

    const userPrompt = `
Business: ${context.business.name} (${context.business.type})
Location: ${context.business.location}

Current Metrics:
- Revenue: ${context.metrics.revenue.value} (${context.metrics.revenue.delta > 0 ? '+' : ''}${context.metrics.revenue.delta}%)
- Orders: ${context.metrics.orders.value} (${context.metrics.orders.delta > 0 ? '+' : ''}${context.metrics.orders.delta}%)
- Conversion: ${context.metrics.conversion.value}%
- Inventory Health: ${context.metrics.inventory.value}%
- Customer Retention: ${context.metrics.retention.value}%
- Review Sentiment: ${context.metrics.sentiment.value}/5

Context:
- Recent orders: ${context.patterns.recentOrderCount}
- Avg order value: ₹${context.patterns.avgOrderValue}
- Low stock items: ${context.patterns.lowStockItemsCount}
- Negative reviews (recent): ${context.patterns.negativeReviewsCount}
- Repeat customers: ${context.patterns.repeatCustomerCount}/${context.patterns.totalCustomers}

Time: ${context.timeContext.isDayOfWeek}, ${getSeason(context.timeContext.currentMonth)}, ${context.timeContext.currentHour}:00
Environmental: ${context.environmental.temp}, ${context.environmental.condition} (${context.environmental.impact})

Generate insights explaining why these metrics are at these levels. Encourage taking advantage of favorable weather or mitigating negative weather impacts where applicable.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from LLM response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    return Array.isArray(insights) ? insights : [insights];
  } catch (error) {
    console.error('LLM insight generation error:', error);
    return generateFallbackInsights(context);
  }
}

/**
 * Fallback insights when LLM is unavailable
 */
function generateFallbackInsights(context) {
  const insights = [];
  const { metrics, patterns, timeContext, recentIssues } = context;

  // Insight 1: Revenue trend
  if (metrics.revenue.delta > 15) {
    insights.push({
      title: 'Revenue Growing Strong',
      body: `Your revenue increased by ${metrics.revenue.delta}% this month. Strong customer demand is driving sales.`,
      severity: 'positive',
      evidence: ['revenue_surge', 'growth_trend'],
    });
  } else if (metrics.revenue.delta < -15) {
    insights.push({
      title: 'Revenue Decline Detected',
      body: `Revenue dropped ${Math.abs(metrics.revenue.delta)}% this month. Consider seasonal factors or reduced marketing reach.`,
      severity: 'negative',
      evidence: ['revenue_drop', 'low_orders'],
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
 */
async function saveInsights(businessId, insights) {
  // Keep one current reasoning set per business.
  await prisma.insight.deleteMany({
    where: { businessId },
  });

  // Save new insights
  for (const insight of insights) {
    await prisma.insight.create({
      data: {
        businessId,
        title: insight.title,
        body: insight.body,
        severity: insight.severity || 'info',
        evidence: JSON.stringify(insight.evidence || []),
      },
    });
  }
}

/**
 * Get season from month
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
 */
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

/**
 * Answer a user query about their business using LLM
 */
async function askAtlas(businessId, query) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { metrics: true, insights: true }
    });

    if (!business) throw new Error('Business not found');

    const metricsMap = business.metrics.reduce((acc, m) => ({ ...acc, [m.key]: m }), {});
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
Current Metrics: Revenue ${context.metrics.revenue?.value || 0}, Orders ${context.metrics.orders?.value || 0}
Recent Insights: ${business.insights.slice(0, 2).map(i => i.title).join(', ')}

User Question: "${query}"

Provide a data-backed answer as Atlas.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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

module.exports = {
  generateInsights,
  gatherBusinessContext,
  generateInsightsViaLLM,
  generateFallbackInsights,
  askAtlas,
};
