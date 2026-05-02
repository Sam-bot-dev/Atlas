const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

// @desc    Register a new business
// @route   POST /api/v1/businesses
// @access  Private
const registerBusiness = asyncHandler(async (req, res) => {
  const { name, category, placeId, address, goals } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide a business name and category');
  }

  const business = await prisma.business.create({
    data: {
      name,
      category,
      placeId: placeId || '',
      address: address || '',
      goals: goals ? JSON.stringify(goals) : '[]',
      userId: req.user.id,
    },
  });

  res.status(201).json({
    id: business.id,
    name: business.name,
    category: business.category,
    placeId: business.placeId,
    address: business.address,
    goals: JSON.parse(business.goals),
    createdAt: business.createdAt,
  });
});

// @desc    Get businesses for logged in user
// @route   GET /api/v1/businesses
// @access  Private
const getBusinesses = asyncHandler(async (req, res) => {
  const businesses = await prisma.business.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json(
    businesses.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      placeId: b.placeId,
      address: b.address,
      goals: JSON.parse(b.goals),
      createdAt: b.createdAt,
    }))
  );
});

// @desc    Get single business by ID
// @route   GET /api/v1/businesses/:id
// @access  Private
const getBusiness = asyncHandler(async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      dataSources: { orderBy: { createdAt: 'desc' } },
      metrics: true,
      insights: { orderBy: { createdAt: 'desc' } },
      actions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  // Parse JSON fields
  const safeParse = (str, fallback = []) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  res.json({
    ...business,
    goals: safeParse(business.goals),
    peakHours: safeParse(business.peakHours),
    revenueSeries: safeParse(business.revenueSeries),
    ordersSeries: safeParse(business.ordersSeries),
    customerGrowth: safeParse(business.customerGrowth),
    topMovers: safeParse(business.topMovers),
    spendingMix: safeParse(business.spendingMix),
    metrics: business.metrics.reduce((acc, m) => {
      acc[m.key] = m;
      return acc;
    }, {}),
    insights: business.insights.map(i => ({
      ...i,
      evidence: safeParse(i.evidence)
    }))
  });
});

// @desc    Update a business
// @route   PUT /api/v1/businesses/:id
// @access  Private
const updateBusiness = asyncHandler(async (req, res) => {
  const existing = await prisma.business.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    res.status(404);
    throw new Error('Business not found');
  }

  const { name, category, placeId, address, goals } = req.body;

  const updated = await prisma.business.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(placeId !== undefined && { placeId }),
      ...(address !== undefined && { address }),
      ...(goals !== undefined && { goals: JSON.stringify(goals) }),
    },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    category: updated.category,
    address: updated.address,
    goals: JSON.parse(updated.goals),
  });
});

// @desc    Delete a business
// @route   DELETE /api/v1/businesses/:id
// @access  Private
const deleteBusiness = asyncHandler(async (req, res) => {
  const existing = await prisma.business.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    res.status(404);
    throw new Error('Business not found');
  }

  await prisma.business.delete({ where: { id: req.params.id } });

  res.json({ id: req.params.id, deleted: true });
});

module.exports = {
  registerBusiness,
  getBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
};
