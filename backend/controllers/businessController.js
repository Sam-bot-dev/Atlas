const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

// @desc    Get businesses for user (supports ?demo=true filter)
// @route   GET /api/v1/businesses
// @access  Private
const getBusinesses = asyncHandler(async (req, res) => {
  const { demo } = req.query;
  const isDemoFilter = demo === 'true';

  const businesses = await prisma.business.findMany({
    where: {
      userId: req.user.id,
      ...(isDemoFilter && { isDemo: true }),
      NOT: isDemoFilter && { isDemo: false },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      metrics: true,
      insights: true,
      actions: true,
    },
  });

  // Flatten JSON fields for frontend compatibility
  const flattened = businesses.map(biz => ({
    ...biz,
    metrics: biz.metrics.reduce((acc, m) => ({ ...acc, [m.key]: m }), {}),
    insights: biz.insights,
    actions: biz.actions,
  }));

  res.json(flattened);
});

// @desc    Create new business for user
// @route   POST /api/v1/businesses
// @access  Private
const createBusiness = asyncHandler(async (req, res) => {
  const { name, category, type, location, address } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error('Name and category required');
  }

  const business = await prisma.business.create({
    data: {
      name,
      category,
      type: type || '',
      location: location || '',
      address: address || '',
      owner: req.user.name,
      initials: name.slice(0, 2).toUpperCase(),
      color: '#4f46e5',
      userId: req.user.id,
      isDemo: false, // Always real for user-created
    },
    include: {
      metrics: true,
      insights: true,
      actions: true,
    },
  });

  const flattened = {
    ...business,
    metrics: business.metrics.reduce((acc, m) => ({ ...acc, [m.key]: m }), {}),
    insights: business.insights || [],
    actions: business.actions || [],
  };

  res.status(201).json(flattened);
});

// @desc    Get single business
// @route   GET /api/v1/businesses/:id
// @access  Private
const getBusiness = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const business = await prisma.business.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
    include: {
      metrics: true,
      insights: true,
      actions: true,
    },
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const flattened = {
    ...business,
    metrics: business.metrics.reduce((acc, m) => ({ ...acc, [m.key]: m }), {}),
    insights: business.insights || [],
    actions: business.actions || [],
  };

  res.json(flattened);
});

// @desc    Update business
// @route   PATCH /api/v1/businesses/:id
// @access  Private
const updateBusiness = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const business = await prisma.business.updateMany({
    where: {
      id,
      userId: req.user.id,
    },
    data: updates,
  });

  if (business.count === 0) {
    res.status(404);
    throw new Error('Business not found');
  }

  // Return updated business
  const updated = await prisma.business.findUnique({
    where: { id },
    include: { metrics: true, insights: true, actions: true },
  });

  const flattened = {
    ...updated,
    metrics: updated.metrics.reduce((acc, m) => ({ ...acc, [m.key]: m }), {}),
    insights: updated.insights || [],
    actions: updated.actions || [],
  };

  res.json(flattened);
});

module.exports = {
  getBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
};

