const { prisma } = require('../prisma');

const asJson = (value) => JSON.stringify(value || {});
const dateOrNull = (value) => (value ? new Date(value) : null);

const createRows = async (model, rows, mapper) => {
  if (!rows.length) return 0;
  await prisma[model].createMany({
    data: rows.map(mapper),
  });
  return rows.length;
};

const refreshMetrics = async (businessId) => {
  const orders = await prisma.order.findMany({ where: { businessId } });
  const inventory = await prisma.inventoryItem.findMany({ where: { businessId } });
  const reviews = await prisma.review.findMany({ where: { businessId } });

  const metricUpdates = [];

  if (orders.length) {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    metricUpdates.push(
      { key: 'revenue', value: revenue, unit: '₹', label: 'Revenue', period: 'from uploaded data' },
      { key: 'orders', value: orders.length, unit: '', label: 'Orders', period: 'from uploaded data' },
    );
  }

  if (inventory.length) {
    const inventoryLow = inventory.filter((item) => item.status !== 'ok').length;
    const inventoryHealth = Math.max(0, Math.round(((inventory.length - inventoryLow) / inventory.length) * 100));
    metricUpdates.push({ key: 'inventory', value: inventoryHealth, unit: '%', label: 'Inventory health', period: 'latest uploads' });
  }

  if (reviews.length) {
    const sentiment = Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
    metricUpdates.push({ key: 'sentiment', value: sentiment, unit: '/5', label: 'Review sentiment', period: 'latest uploads' });
  }

  for (const metric of metricUpdates) {
    await prisma.metric.upsert({
      where: { businessId_key: { businessId, key: metric.key } },
      update: { ...metric, delta: 0 },
      create: { ...metric, delta: 0, businessId },
    });
  }
};

const createDerivedRecords = async (businessId, counts) => {
  if (counts.orders > 0) {
    await prisma.insight.create({
      data: {
        businessId,
        title: 'Fresh upload normalized into sales records',
        body: `${counts.orders} orders were extracted and merged into Atlas metrics.`,
        severity: 'info',
        evidence: JSON.stringify(['Upload pipeline', 'Structured extraction']),
      },
    });
  }

  if (counts.inventory > 0) {
    await prisma.action.create({
      data: {
        businessId,
        title: 'Review inventory items from latest upload',
        body: `${counts.inventory} inventory rows were imported. Check low-stock items before next demand spike.`,
        impact: 'Avoid stockout',
        effort: 'Low',
        confidence: '82%',
        urgent: false,
      },
    });
  }
};

const normalizeExtraction = async ({ businessId, sourceId, extraction }) => {
  const counts = {};

  counts.orders = await createRows('order', extraction.orders, (row) => ({
    ...row,
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

  counts.customers = await createRows('customer', extraction.customers, (row) => ({
    ...row,
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

  await refreshMetrics(businessId);
  await createDerivedRecords(businessId, counts);

  return counts;
};

module.exports = { normalizeExtraction };
