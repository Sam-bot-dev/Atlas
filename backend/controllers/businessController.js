const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

const parseJsonField = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

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
    goals: parseJsonField(biz.goals, []),
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

// @desc    Detect business category from name + address via Google Places API
// @route   POST /api/v1/businesses/detect
// @access  Private
const detectBusiness = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (!name) { res.status(400); throw new Error('Business name is required'); }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // Never fall back to Vision key
  if (apiKey) {
    try {
      const query = encodeURIComponent(`${name} ${address || ''}`.trim());
      const placesRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=name,types,formatted_address&key=${apiKey}`
      );
      const data = await placesRes.json();
      const candidate = data.candidates?.[0];
      if (candidate) {
        const typeMap = {
          bakery: 'Bakery', restaurant: 'Restaurant', cafe: 'Café',
          pharmacy: 'Pharmacy', clothing_store: 'Retail', hardware_store: 'Hardware',
          grocery_or_supermarket: 'Grocery', beauty_salon: 'Salon', gym: 'Fitness',
          electronics_store: 'Electronics', home_goods_store: 'Home Goods',
        };
        const matchedType = candidate.types?.find(t => typeMap[t]);
        return res.json({
          name: candidate.name,
          address: candidate.formatted_address,
          category: matchedType ? typeMap[matchedType] : 'Business',
          detectedVia: 'google_places',
        });
      }
    } catch (err) {
      console.error('[detectBusiness] Places API error:', err.message);
    }
  }

  // Deterministic regex fallback
  const lower = name.toLowerCase();
  let category = 'Business';
  if (/bak[e]?ry|cake|sweets|mithai/.test(lower)) category = 'Bakery';
  else if (/pharmacy|medical|chemist|drug/.test(lower)) category = 'Pharmacy';
  else if (/cafe|coffee|chai/.test(lower)) category = 'Café';
  else if (/salon|spa|beauty|hair/.test(lower)) category = 'Salon';
  else if (/restaurant|hotel|dhaba|biryani|tiffin/.test(lower)) category = 'Restaurant';
  else if (/gym|fitness|yoga/.test(lower)) category = 'Fitness';
  else if (/shop|store|mart|retail/.test(lower)) category = 'Retail';

  res.json({ name, address: address || '', category, detectedVia: 'regex' });
});

module.exports = {
  getBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  detectBusiness,
};

