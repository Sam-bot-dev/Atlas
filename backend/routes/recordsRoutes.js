const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const { prisma } = require('../lib/prisma');
const { calculateMetrics, saveMetrics } = require('../services/metricService');

const router = express.Router({ mergeParams: true });

const ensureBusiness = async (req, res) => {
  const biz = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });
  if (!biz) { res.status(404); throw new Error('Business not found'); }
  return biz;
};

// GET all records
router.get('/', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req, res);
  const bizId = req.params.bizId;
  const [orders, customers, products, reviews, inventory] = await Promise.all([
    prisma.order.findMany({ where: { businessId: bizId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.customer.findMany({ where: { businessId: bizId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.product.findMany({ where: { businessId: bizId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.review.findMany({ where: { businessId: bizId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.inventoryItem.findMany({ where: { businessId: bizId }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);
  res.json({ orders, customers, products, reviews, inventory });
}));

// PATCH a single record
router.patch('/:type/:id', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req, res);
  const { type, id } = req.params;
  const updates = req.body;

  const modelMap = {
    orders: 'order',
    customers: 'customer',
    products: 'product',
    reviews: 'review',
    inventory: 'inventoryItem',
  };

  const model = modelMap[type];
  if (!model) { res.status(400); throw new Error('Invalid record type'); }

  // Verify record belongs to this business
  const existing = await prisma[model].findFirst({ where: { id, businessId: business.id } });
  if (!existing) { res.status(404); throw new Error('Record not found'); }

  // Strip fields that shouldn't be updated directly
  const { id: _id, businessId: _biz, sourceId: _src, createdAt: _ca, ...safe } = updates;

  const updated = await prisma[model].update({ where: { id }, data: safe });

  // Recalculate metrics after edit
  try {
    const metrics = await calculateMetrics(business.id);
    await saveMetrics(business.id, metrics);
  } catch (err) {
    console.warn('[records] metric recalc failed (non-fatal):', err.message);
  }

  res.json(updated);
}));

// DELETE a single record
router.delete('/:type/:id', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req, res);
  const { type, id } = req.params;

  const modelMap = {
    orders: 'order',
    customers: 'customer',
    products: 'product',
    reviews: 'review',
    inventory: 'inventoryItem',
  };

  const model = modelMap[type];
  if (!model) { res.status(400); throw new Error('Invalid record type'); }

  const existing = await prisma[model].findFirst({ where: { id, businessId: business.id } });
  if (!existing) { res.status(404); throw new Error('Record not found'); }

  await prisma[model].delete({ where: { id } });

  // Recalculate metrics after delete
  try {
    const metrics = await calculateMetrics(business.id);
    await saveMetrics(business.id, metrics);
  } catch (err) {
    console.warn('[records] metric recalc failed (non-fatal):', err.message);
  }

  res.json({ deleted: true, id });
}));

module.exports = router;
