/**
 * Action Service
 * 
 * Generates prioritized, data-backed recommendations
 * Produces: "What to do next?" actions
 * 
 * Takes:
 * - Insights
 * - Metrics
 * - Historical success data
 * 
 * Outputs: Standard + Advanced action recommendations
 * Scored by Impact, Effort, Confidence
 */

const { prisma } = require('../lib/prisma');

/**
 * Generate recommended actions for a business
 * @param {string} businessId
 * @param {Object} metrics - calculated metrics
 * @param {Array} insights - generated insights
 * @returns {Promise<Array>} action recommendations
 */
async function generateActions(businessId, metrics, insights) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error('Business not found');

    // Gather data for recommendations
    const context = await gatherActionContext(businessId, business, metrics, insights);

    // Generate standard actions (from rules)
    const standardActions = generateStandardActions(context);

    // Generate advanced actions (from ML patterns)
    const advancedActions = generateAdvancedActions(context);

    // Combine and prioritize
    const allActions = [...standardActions, ...advancedActions];
    const prioritized = prioritizeActions(allActions, context);

    // Save to database
    await saveActions(businessId, prioritized);

    return prioritized;
  } catch (error) {
    console.error(`Error generating actions for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Gather context for action generation
 */
async function gatherActionContext(businessId, business, metrics, insights) {
  const [orders, inventory, reviews, customers] = await Promise.all([
    prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.inventoryItem.findMany({
      where: { businessId },
    }),
    prisma.review.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.customer.findMany({
      where: { businessId },
    }),
  ]);

  return {
    business,
    metrics,
    insights,
    data: {
      recentOrders: orders,
      inventory,
      reviews,
      customers,
      lowStockItems: inventory.filter((i) => i.quantityOnHand <= i.reorderPoint),
      negativeReviews: reviews.filter((r) => r.rating <= 2),
      repeatCustomers: customers.filter((c) => c.ordersCount > 1),
    },
  };
}

/**
 * Standard rule-based actions
 */
function generateStandardActions(context) {
  const actions = [];
  const { metrics, data } = context;

  // 1. Low Inventory → Restock
  if (data.lowStockItems.length > 0) {
    const items = data.lowStockItems.slice(0, 3);
    actions.push({
      title: 'Restock Low-Inventory Items',
      body: `${items.length} items are below reorder point: ${items.map((i) => i.itemName).join(', ')}. Place orders immediately to avoid stockouts.`,
      impact: 'High',
      effort: 'Low',
      confidence: 'High',
      urgent: true,
      category: 'inventory',
    });
  }

  // 2. Negative Reviews → Respond
  if (data.negativeReviews.length > 0) {
    actions.push({
      title: 'Respond to Negative Reviews',
      body: `${data.negativeReviews.length} recent low-rating reviews need attention. Craft personalized responses to show you care and resolve issues.`,
      impact: 'Medium',
      effort: 'Medium',
      confidence: 'High',
      urgent: false,
      category: 'customer_care',
    });
  }

  // 3. Low Conversion → Optimize
  if (metrics.conversion.value < 2) {
    actions.push({
      title: 'Improve Conversion Rate',
      body: `Only ${metrics.conversion.value}% of visitors convert. Review website/app usability, simplify checkout, and add urgency (limited-time offers).`,
      impact: 'High',
      effort: 'High',
      confidence: 'Medium',
      urgent: false,
      category: 'marketing',
    });
  }

  // 4. Low Retention → Engage Repeat Customers
  if (metrics.retention.value < 30) {
    actions.push({
      title: 'Launch Loyalty Program',
      body: `Only ${metrics.retention.value}% of customers repeat. Create a loyalty program with rewards for repeat purchases to boost retention.`,
      impact: 'High',
      effort: 'Medium',
      confidence: 'High',
      urgent: false,
      category: 'customer_engagement',
    });
  }

  // 5. Revenue Declining → Investigate & Act
  if (metrics.revenue.delta < -10) {
    actions.push({
      title: 'Investigate Revenue Decline',
      body: `Revenue dropped ${Math.abs(metrics.revenue.delta)}%. Analyze top-selling items, customer acquisition changes, and competitive activity. Consider promotional campaigns.`,
      impact: 'High',
      effort: 'Medium',
      confidence: 'Medium',
      urgent: true,
      category: 'business_strategy',
    });
  }

  // 6. Low Rating → Quality Improvement
  if (metrics.sentiment.value < 3) {
    actions.push({
      title: 'Quality & Service Improvement Plan',
      body: `Customer rating is ${metrics.sentiment.value}/5. Focus on service quality, delivery speed, and product consistency. Train staff and gather detailed feedback.`,
      impact: 'High',
      effort: 'High',
      confidence: 'High',
      urgent: true,
      category: 'operations',
    });
  }

  return actions;
}

/**
 * Advanced pattern-based actions
 */
function generateAdvancedActions(context) {
  const actions = [];
  const { metrics, data, business, insights } = context;

  // 1. Bundle Slow Sellers
  const topMovers = data.recentOrders
    .reduce((acc, order) => {
      const existing = acc.find((m) => m.name === order.productName);
      if (existing) existing.count++;
      else acc.push({ name: order.productName, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(5); // slow movers are outside top 5

  if (topMovers.length > 0) {
    actions.push({
      title: 'Create Product Bundles',
      body: `Bundle ${topMovers.length} slow-moving products with popular items to increase their sales. Example: "${topMovers[0]?.name}" + bestseller bundle at 15% discount.`,
      impact: 'Medium',
      effort: 'Low',
      confidence: 'Medium',
      urgent: false,
      category: 'sales',
    });
  }

  // 2. Target Time-Based Promotions
  const now = new Date();
  const hour = now.getHours();
  const isOffPeakHour = hour < 9 || hour > 19;

  if (isOffPeakHour && metrics.conversion.value < 2) {
    actions.push({
      title: 'Off-Peak Hour Promotions',
      body: `Launch special discounts during slow hours (${hour}:00) to attract customers. Offer "Happy Hour" deals to boost traffic.`,
      impact: 'Medium',
      effort: 'Low',
      confidence: 'Medium',
      urgent: false,
      category: 'marketing',
    });
  }

  // 3. Personalized Customer Outreach
  if (data.repeatCustomers.length > 0) {
    const avgOrderValue = data.recentOrders.length > 0
      ? Math.round(
          data.recentOrders.reduce((sum, o) => sum + o.total, 0) /
            data.recentOrders.length,
        )
      : 0;

    actions.push({
      title: 'Personalized Follow-Up Campaign',
      body: `You have ${data.repeatCustomers.length} loyal customers. Send personalized offers/new product notifications. Avg order value: ₹${avgOrderValue}.`,
      impact: 'Medium',
      effort: 'Low',
      confidence: 'High',
      urgent: false,
      category: 'customer_engagement',
    });
  }

  // 4. Seasonal Strategy
  const season = getSeason(now.getMonth());
  const seasonalInsight = `Adjust inventory for ${season} season. Stock items relevant to ${season} demand patterns.`;

  actions.push({
    title: `${season} Season Strategy`,
    body: seasonalInsight,
    impact: 'Medium',
    effort: 'Medium',
    confidence: 'Medium',
    urgent: false,
    category: 'business_strategy',
  });

  return actions;
}

/**
 * Prioritize actions by score
 */
function prioritizeActions(actions, context) {
  return actions
    .map((action) => {
      // Calculate priority score
      const impactScore = { High: 3, Medium: 2, Low: 1 }[action.impact] || 2;
      const effortScore = { High: 1, Medium: 2, Low: 3 }[action.effort] || 2; // lower effort is better
      const confidenceScore =
        { High: 3, Medium: 2, Low: 1 }[action.confidence] || 2;

      const score = impactScore * 0.5 + effortScore * 0.3 + confidenceScore * 0.2;
      const urgencyBoost = action.urgent ? 2 : 0;

      return {
        ...action,
        score: score + urgencyBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...action }) => action)
    .slice(0, 8); // top 8 actions
}

/**
 * Save actions to database
 */
async function saveActions(businessId, actions) {
  // Delete old actions (keep only recent ones)
  await prisma.action.deleteMany({
    where: {
      businessId,
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // older than 24 hours
      },
    },
  });

  // Save new actions
  for (const action of actions) {
    await prisma.action.create({
      data: {
        businessId,
        title: action.title,
        body: action.body,
        impact: action.impact,
        effort: action.effort,
        confidence: action.confidence,
        urgent: action.urgent,
        status: 'pending',
      },
    });
  }
}

/**
 * Get season from month (India-specific)
 */
function getSeason(month) {
  if (month >= 2 && month <= 4) return 'Summer';
  if (month >= 5 && month <= 9) return 'Monsoon';
  if (month >= 10 && month <= 11) return 'Post-Monsoon';
  return 'Winter';
}

module.exports = {
  generateActions,
  gatherActionContext,
  generateStandardActions,
  generateAdvancedActions,
  prioritizeActions,
};
