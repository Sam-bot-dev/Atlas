/**
 * Webhook Service
 * 
 * Handles outgoing webhooks to integrate with external tools
 * Enables "Take Action" button to trigger external workflows
 * 
 * Supported integrations:
 * - Shopify
 * - Square
 * - WooCommerce
 * - Custom webhooks
 */

const { prisma } = require('../lib/prisma');

/**
 * Webhook configuration schema:
 * 
 * model Integration {
 *   id        String @id @default(cuid())
 *   type      String // 'shopify' | 'square' | 'woocommerce' | 'custom'
 *   name      String
 *   webhookUrl String
 *   apiKey    String @db.Text // encrypted
 *   isActive  Boolean @default(true)
 *   createdAt DateTime @default(now())
 *   businessId String
 *   business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
 * }
 */

/**
 * Trigger an action via webhook
 * @param {string} businessId
 * @param {string} actionType - restock | review_reply | promotion | staffing_alert
 * @param {Object} payload - action-specific data
 */
async function triggerAction(businessId, actionType, payload) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error('Business not found');

    // Build action payload based on type
    const actionPayload = buildActionPayload(actionType, payload, business);

    // Get active integrations
    const integrations = []; // Will be fetched from DB once model is added
    // const integrations = await prisma.integration.findMany({
    //   where: { businessId, isActive: true }
    // });

    const results = [];

    // Send to all configured integrations
    for (const integration of integrations) {
      const result = await sendWebhook(
        integration.webhookUrl,
        actionPayload,
        integration.apiKey,
      );
      results.push(result);
    }

    return {
      actionType,
      businessId,
      status: results.every((r) => r.success) ? 'success' : 'partial',
      results,
    };
  } catch (error) {
    console.error(`Error triggering action for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Build payload specific to action type
 */
function buildActionPayload(actionType, payload, business) {
  const timestamp = new Date().toISOString();

  const basePayload = {
    source: 'atlas',
    businessId: business.id,
    businessName: business.name,
    timestamp,
  };

  switch (actionType) {
    case 'restock':
      return {
        ...basePayload,
        action: 'restock',
        items: payload.items, // [{ sku, itemName, quantity }]
        note: payload.note || 'Auto-generated restock order from Atlas',
      };

    case 'review_reply':
      return {
        ...basePayload,
        action: 'reply_to_review',
        platform: payload.platform, // 'google' | 'facebook' | etc
        reviewId: payload.reviewId,
        reply: payload.reply,
      };

    case 'promotion':
      return {
        ...basePayload,
        action: 'create_promotion',
        title: payload.title,
        discountPercent: payload.discountPercent,
        validUntil: payload.validUntil,
        targetSegment: payload.targetSegment || 'all',
        code: generatePromoCode(),
      };

    case 'staffing_alert':
      return {
        ...basePayload,
        action: 'staffing_alert',
        alertType: payload.alertType, // 'high_traffic' | 'low_capacity'
        expectedTraffic: payload.expectedTraffic,
        recommendedStaff: payload.recommendedStaff,
      };

    case 'inventory_sync':
      return {
        ...basePayload,
        action: 'sync_inventory',
        items: payload.items, // Current inventory from Atlas
      };

    case 'customer_outreach':
      return {
        ...basePayload,
        action: 'customer_outreach',
        customerIds: payload.customerIds,
        campaignType: payload.campaignType, // 'loyalty' | 'win_back' | 'vip'
        message: payload.message,
      };

    default:
      return basePayload;
  }
}

/**
 * Send webhook to external service
 */
async function sendWebhook(webhookUrl, payload, apiKey) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Atlas-Signature': generateSignature(payload, apiKey),
      'X-Atlas-Timestamp': new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      webhookUrl,
      statusCode: response.status,
      response: data,
    };
  } catch (error) {
    console.error(`Webhook error to ${webhookUrl}:`, error);
    return {
      success: false,
      webhookUrl,
      error: error.message,
    };
  }
}

/**
 * Handle incoming webhook from external service
 * (e.g., Shopify order update)
 */
async function handleIncomingWebhook(businessId, source, payload) {
  try {
    switch (source) {
      case 'shopify':
        return await handleShopifyWebhook(businessId, payload);
      case 'square':
        return await handleSquareWebhook(businessId, payload);
      case 'woocommerce':
        return await handleWooCommerceWebhook(businessId, payload);
      default:
        console.warn(`Unknown webhook source: ${source}`);
        return { processed: false, reason: 'Unknown source' };
    }
  } catch (error) {
    console.error(
      `Error handling webhook from ${source} for business ${businessId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Handle Shopify webhook
 */
async function handleShopifyWebhook(businessId, payload) {
  // Process order, product, or inventory update from Shopify
  // This would integrate with the data ingestion pipeline
  return { processed: true, source: 'shopify' };
}

/**
 * Handle Square webhook
 */
async function handleSquareWebhook(businessId, payload) {
  // Process transaction or inventory update from Square
  return { processed: true, source: 'square' };
}

/**
 * Handle WooCommerce webhook
 */
async function handleWooCommerceWebhook(businessId, payload) {
  // Process order or product update from WooCommerce
  return { processed: true, source: 'woocommerce' };
}

/**
 * Generate HMAC signature for webhook verification
 */
function generateSignature(payload, apiKey) {
  const crypto = require('crypto');
  const message = JSON.stringify(payload);
  return crypto.createHmac('sha256', apiKey || 'atlas-secret').update(message).digest('hex');
}

/**
 * Verify incoming webhook signature
 */
function verifySignature(payload, signature, apiKey) {
  const expectedSignature = generateSignature(payload, apiKey);
  return signature === expectedSignature;
}

/**
 * Generate promotional code
 */
function generatePromoCode() {
  const prefix = 'ATL';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

/**
 * Register a new webhook endpoint
 */
async function registerWebhook(businessId, type, webhookUrl, apiKey) {
  // Will use Integration model when added to Prisma schema
  // return await prisma.integration.create({
  //   data: {
  //     businessId,
  //     type,
  //     name: `${type} integration`,
  //     webhookUrl,
  //     apiKey: encryptApiKey(apiKey),
  //     isActive: true
  //   }
  // });

  return {
    registered: true,
    businessId,
    type,
    webhookUrl,
  };
}

/**
 * List active webhooks for a business
 */
async function listWebhooks(businessId) {
  // return await prisma.integration.findMany({
  //   where: { businessId, isActive: true },
  //   select: { id, type, name, webhookUrl }
  // });

  return [];
}

module.exports = {
  triggerAction,
  buildActionPayload,
  sendWebhook,
  handleIncomingWebhook,
  verifySignature,
  registerWebhook,
  listWebhooks,
  generatePromoCode,
};
