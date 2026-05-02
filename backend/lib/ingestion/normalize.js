const { prisma } = require('../prisma');
const { calculateMetrics, saveMetrics } = require('../../services/metricService');
const { generateInsights } = require('../../services/insightService');
const { generateActions } = require('../../services/actionService');
const { detectAnomalies } = require('../../services/mlService');
const { evaluateAutomations } = require('../../services/automationService');

const asJson = (value) => JSON.stringify(value || {});
const dateOrNull = (value) => (value ? new Date(value) : null);
const fingerprint = (row) =>
  Buffer.from(JSON.stringify(row)).toString('base64url').slice(0, 80);

const createRows = async (model, rows, mapper) => {
  if (!rows.length) return 0;
  await prisma[model].createMany({
    data: rows.map(mapper),
  });
  return rows.length;
};

const createUniqueRows = async (model, rows, mapper) => {
  let count = 0;
  for (const row of rows) {
    try {
      await prisma[model].create({ data: mapper(row) });
      count += 1;
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }
  return count;
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

  counts.reviews = await createRows('review', extraction.reviews, (row) => ({
    ...row,
    reviewDate: dateOrNull(row.reviewDate),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.inventory = await createRows('inventoryItem', extraction.inventory.filter((row) => row.itemName), (row) => ({
    ...row,
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  counts.traffic = await createRows('trafficPoint', extraction.traffic, (row) => ({
    ...row,
    occurredAt: dateOrNull(row.occurredAt),
    rawPayload: asJson(row),
    businessId,
    sourceId,
  }));

  const metrics = await calculateMetrics(businessId);
  await saveMetrics(businessId, metrics);

  const insights = await generateInsights(businessId, metrics);
  await generateActions(businessId, metrics, insights);
  await detectAnomalies(businessId, evaluateAutomations);

  return counts;
};

module.exports = { normalizeExtraction };
