/* eslint-env node */
const { prisma } = require('../prisma');
const { calculateMetrics, saveMetrics } = require('../../services/metricService');
const { generateInsights } = require('../../services/insightService');
const { generateActions } = require('../../services/actionService');
const { detectAnomalies } = require('../../services/mlService');
const { evaluateAutomations } = require('../../services/automationService');

const asJson = (value) => {
  try { return JSON.stringify(value || {}); } catch { return '{}'; }
};

const dateOrNull = (value) => (value ? new Date(value) : null);

const fingerprint = (row) => {
  const sorted = Object.keys(row).sort().reduce((acc, k) => ({ ...acc, [k]: row[k] }), {});
  return Buffer.from(JSON.stringify(sorted)).toString('base64url').slice(0, 80);
};

// createUniqueRows must be declared before createRows (const hoisting doesn't apply)
const createUniqueRows = async (model, rows, mapper) => {
  let count = 0;
  for (const row of rows) {
    try {
      await prisma[model].create({ data: mapper(row) });
      count += 1;
    } catch (error) {
      // P2002 = unique constraint violation — skip duplicate, don't crash
      if (error.code !== 'P2002') throw error;
    }
  }
  return count;
};

const createRows = async (model, rows, mapper) => {
  if (!rows.length) return 0;
  return createUniqueRows(model, rows, mapper);
};

const normalizeExtraction = async ({ businessId, sourceId, extraction }) => {
  const counts = {};

  counts.orders = await createUniqueRows('order', extraction.orders, (row) => ({
    ...row,
    externalId: row.externalId || fingerprint(row),
    orderDate: dateOrNull(row.orderDate),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.products = await createRows('product', extraction.products.filter((row) => row.name), (row) => ({
    ...row,
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.customers = await createUniqueRows('customer', extraction.customers, (row) => ({
    ...row,
    externalId: row.externalId || fingerprint(row),
    ordersCount: Math.round(row.ordersCount || 0),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.reviews = await createUniqueRows('review', extraction.reviews, (row) => ({
    ...row,
    reviewDate: dateOrNull(row.reviewDate),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.inventory = await createUniqueRows('inventoryItem', extraction.inventory.filter((row) => row.itemName), (row) => ({
    ...row,
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.traffic = await createUniqueRows('trafficPoint', extraction.traffic, (row) => ({
    ...row,
    occurredAt: dateOrNull(row.occurredAt),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  const metrics = await calculateMetrics(businessId);
  await saveMetrics(businessId, metrics);

  // Generate insights and actions — non-fatal if LLM is unavailable
  try {
    const insights = await generateInsights(businessId, metrics);
    await generateActions(businessId, metrics, insights);
  } catch (err) {
    console.warn('[normalize] insight/action generation failed (non-fatal):', err.message);
  }

  // Anomaly detection — always non-blocking
  detectAnomalies(businessId, evaluateAutomations).catch(err =>
    console.warn('[normalize] anomaly detection failed:', err.message)
  );

  return counts;
};

module.exports = { normalizeExtraction };
