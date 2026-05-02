/**
 * Task Service
 * 
 * Manages daily action lists, scheduled follow-ups, and task automation
 * Generates automated task lists based on insights and actions
 */

const { prisma } = require('../lib/prisma');

/**
 * Task model - stored in database
 * Should be added to Prisma schema:
 * 
 * model Task {
 *   id        String   @id @default(cuid())
 *   title     String
 *   body      String
 *   type      String   // 'daily' | 'follow_up' | 'restock' | 'review_reply' | 'customer_outreach'
 *   priority  String   // 'high' | 'medium' | 'low'
 *   dueDate   DateTime?
 *   status    String   @default("pending") // 'pending' | 'in_progress' | 'completed' | 'dismissed'
 *   linkedActionId String?
 *   linkedInsightId String?
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 *   businessId String
 *   business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
 * }
 */

/**
 * Generate daily action list based on insights and actions
 */
async function generateDailyActionList(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error('Business not found');

    // Fetch recent insights and actions
    const insights = await prisma.insight.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const actions = await prisma.action.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const tasks = [];

    // 1. Urgent action tasks
    actions.forEach((action) => {
      if (action.urgent) {
        tasks.push({
          title: action.title,
          body: action.body,
          type: 'action_urgent',
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
          linkedActionId: action.id,
        });
      }
    });

    // 2. Follow-up tasks based on insights
    insights.forEach((insight) => {
      if (insight.severity === 'negative') {
        tasks.push({
          title: `Follow up on: ${insight.title}`,
          body: `Address: ${insight.body}`,
          type: 'follow_up',
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
          linkedInsightId: insight.id,
        });
      }
    });

    // 3. Inventory tasks
    const lowStock = await prisma.inventoryItem.findMany({
      where: {
        businessId,
        quantityOnHand: { lte: prisma.inventoryItem.fields.reorderPoint },
      },
      take: 5,
    });

    lowStock.forEach((item) => {
      tasks.push({
        title: `Restock: ${item.itemName}`,
        body: `Current quantity: ${item.quantityOnHand}. Reorder point: ${item.reorderPoint}`,
        type: 'restock',
        priority: 'high',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
      });
    });

    // 4. Review reply tasks
    const unaddressedReviews = await prisma.review.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    unaddressedReviews.forEach((review) => {
      if (review.rating <= 2) {
        tasks.push({
          title: `Reply to negative review (${review.rating}/5)`,
          body: `Review: "${review.body}"`,
          type: 'review_reply',
          priority: 'high',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        });
      }
    });

    return tasks.slice(0, 8); // Top 8 daily tasks
  } catch (error) {
    console.error(`Error generating daily action list for ${businessId}:`, error);
    throw error;
  }
}

/**
 * Schedule a follow-up task
 */
async function scheduleFollowUp(businessId, title, body, daysFromNow = 3) {
  const dueDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

  return {
    title,
    body,
    type: 'follow_up',
    priority: 'medium',
    dueDate,
  };
}

/**
 * Create inventory reorder task
 */
async function createRestockTask(businessId, itemName, currentQty, reorderPoint) {
  const urgency = currentQty <= reorderPoint / 2 ? 'high' : 'medium';
  const dueDate = new Date(
    Date.now() + (urgency === 'high' ? 1 : 3) * 24 * 60 * 60 * 1000,
  );

  return {
    title: `Restock: ${itemName}`,
    body: `Current: ${currentQty} units | Reorder point: ${reorderPoint}`,
    type: 'restock',
    priority: urgency,
    dueDate,
  };
}

/**
 * Create customer follow-up task
 */
async function createCustomerFollowUp(businessId, customerId, taskType) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) throw new Error('Customer not found');

  let title = '';
  let body = '';

  switch (taskType) {
    case 'repeat_purchase':
      title = `Offer special deal to ${customer.name}`;
      body = `Regular customer (${customer.ordersCount} purchases). Send personalized offer.`;
      break;
    case 'inactive':
      title = `Re-engage inactive customer: ${customer.name}`;
      body = `No recent purchases. Send win-back offer or feedback survey.`;
      break;
    case 'vip':
      title = `VIP customer care: ${customer.name}`;
      body = `High-value customer (${customer.totalSpend}). Ensure premium service.`;
      break;
  }

  return {
    title,
    body,
    type: 'customer_outreach',
    priority: 'medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Auto-generate review reply templates
 */
async function generateReviewReplyTemplate(reviewBody, sentiment) {
  const templates = {
    positive:
      'Thank you for your kind words! We appreciate your support and look forward to serving you again.',
    negative:
      'We appreciate your feedback and sincerely apologize for the inconvenience. Please reach out to us directly so we can make things right.',
    neutral:
      'Thank you for taking the time to share your feedback. We value your thoughts and are always looking to improve.',
  };

  return templates[sentiment] || templates.neutral;
}

/**
 * Mark task as completed
 */
async function completeTask(taskId) {
  // Once Task model is added to Prisma:
  // return await prisma.task.update({
  //   where: { id: taskId },
  //   data: { status: 'completed' }
  // });

  return { id: taskId, status: 'completed' };
}

/**
 * Dismiss task
 */
async function dismissTask(taskId) {
  return { id: taskId, status: 'dismissed' };
}

module.exports = {
  generateDailyActionList,
  scheduleFollowUp,
  createRestockTask,
  createCustomerFollowUp,
  generateReviewReplyTemplate,
  completeTask,
  dismissTask,
};
