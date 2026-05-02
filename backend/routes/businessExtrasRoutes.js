const express = require('express');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

const ensureBusiness = async (req) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
    include: {
      metrics: true,
      insights: { orderBy: { createdAt: 'desc' }, take: 5 },
      actions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!business) {
    const error = new Error('Business not found');
    error.statusCode = 404;
    throw error;
  }

  return business;
};

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

router.get('/sources', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const sources = await prisma.dataSource.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sources.map((source) => ({ ...source, meta: parseJson(source.meta, {}) })));
}));

router.post('/sources', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const type = String(req.body.type || '').trim();
  if (!type) {
    res.status(400);
    throw new Error('Source type is required');
  }

  const source = await prisma.dataSource.create({
    data: {
      type,
      name: req.body.name || type,
      status: 'pending',
      meta: JSON.stringify({ credentialsProvided: Boolean(req.body.credentials) }),
      businessId: business.id,
    },
  });

  res.status(201).json({ ...source, meta: parseJson(source.meta, {}) });
}));

router.delete('/sources/:sourceId', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const source = await prisma.dataSource.findFirst({
    where: { id: req.params.sourceId, businessId: req.params.bizId },
  });
  if (!source) {
    res.status(404);
    throw new Error('Source not found');
  }

  await prisma.dataSource.delete({ where: { id: source.id } });
  res.json({ id: source.id, deleted: true });
}));

router.post('/sources/:sourceId/sync', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const source = await prisma.dataSource.findFirst({
    where: { id: req.params.sourceId, businessId: req.params.bizId },
  });
  if (!source) {
    res.status(404);
    throw new Error('Source not found');
  }

  const updated = await prisma.dataSource.update({
    where: { id: source.id },
    data: {
      status: 'complete',
      meta: JSON.stringify({ ...parseJson(source.meta, {}), lastSyncAt: new Date().toISOString() }),
    },
  });
  res.json({ ...updated, meta: parseJson(updated.meta, {}) });
}));

const { askAtlas } = require('../services/insightService');

router.post('/ask', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const question = String(req.body.query || '').trim();
  
  if (!question) {
    res.status(400);
    throw new Error('Question is required');
  }

  const result = await askAtlas(business.id, question);
  res.json({ query: question, ...result });
}));

router.get('/reports', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  res.json([
    {
      id: `${business.id}-weekly`,
      name: 'Weekly performance brief',
      type: 'weekly',
      createdAt: business.updatedAt,
      status: 'ready',
    },
  ]);
}));

router.post('/reports', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const type = req.body.type || 'weekly';
  res.status(201).json({
    id: `${business.id}-${type}-${Date.now()}`,
    name: `${type} report`,
    type,
    createdAt: new Date().toISOString(),
    status: 'ready',
  });
}));

router.get('/reports/:reportId/download', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  res.type('text/plain').send(`Atlas report for ${business.name}\nReport: ${req.params.reportId}\n`);
}));

router.get('/settings', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  res.json({
    id: business.id,
    name: business.name,
    category: business.category,
    type: business.type,
    location: business.location,
    address: business.address,
    goals: parseJson(business.goals, []),
    dataPrefs: { anonymizeTraining: true, retainRawUploads: false },
  });
}));

router.patch('/settings', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const allowed = ['name', 'category', 'type', 'location', 'address'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const updated = await prisma.business.update({ where: { id: req.params.bizId }, data });
  res.json(updated);
}));

router.patch('/settings/goals', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const goals = Array.isArray(req.body.goals) ? req.body.goals : [];
  const updated = await prisma.business.update({
    where: { id: req.params.bizId },
    data: { goals: JSON.stringify(goals) },
  });
  res.json({ goals: parseJson(updated.goals, []) });
}));

router.patch('/settings/data-prefs', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  res.json({ dataPrefs: req.body || {} });
}));

module.exports = router;
