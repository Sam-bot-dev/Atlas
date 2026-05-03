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
      // Fix #24: NOT: isDemoFilter && {...} evaluated to NOT: false which is invalid Prisma syntax
      ...(isDemoFilter ? { isDemo: true } : {}),
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
  const { name, category, location, address, goals } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error('Name and category required');
  }

  // Fix: validate field lengths to prevent oversized strings reaching the DB
  if (name.length > 100) { res.status(400); throw new Error('Business name must be 100 characters or fewer'); }
  if (category.length > 60) { res.status(400); throw new Error('Category must be 60 characters or fewer'); }
  if (location && location.length > 200) { res.status(400); throw new Error('Location must be 200 characters or fewer'); }
  if (address && address.length > 300) { res.status(400); throw new Error('Address must be 300 characters or fewer'); }

  const business = await prisma.business.create({
    data: {
      name,
      category,
      location: location || '',
      address: address || '',
      goals: Array.isArray(goals) ? JSON.stringify(goals) : (goals || '[]'),
      owner: req.user.name,
      initials: name.slice(0, 2).toUpperCase(),
      color: '#4f46e5',
      userId: req.user.id,
      isDemo: false,
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
     where: { id, userId: req.user.id },
     include: {
       metrics: true,
       insights: true,
       actions: true,
       automations: true,
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
  // Whitelist safe fields — raw req.body let callers overwrite userId, isDemo, etc.
  const { name, category, location, address, goals, color, owner } = req.body;
  const updates = {};
  if (name      !== undefined) updates.name     = name;
  if (category  !== undefined) updates.category = category;
  if (location  !== undefined) updates.location = location;
  if (address   !== undefined) updates.address  = address;
  if (goals     !== undefined) updates.goals    = Array.isArray(goals) ? JSON.stringify(goals) : goals;
  if (color     !== undefined) updates.color    = color;
  if (owner     !== undefined) updates.owner    = owner;

  if (Object.keys(updates).length === 0) {
    return res.json({ message: 'No valid fields to update' });
  }

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
  // Fix: use findFirst with userId so we can't accidentally return another
  // user's record if something unusual happened between updateMany and this read.
  const updated = await prisma.business.findFirst({
    where: { id, userId: req.user.id },
    include: { metrics: true, insights: true, actions: true },
  });

  if (!updated) {
    res.status(404);
    throw new Error('Business not found after update');
  }

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
         const category = matchedType ? typeMap[matchedType] : 'Business';
         const estimates = getHeuristicEstimates(category);
         return res.json({
           name: candidate.name,
           address: candidate.formatted_address,
           category,
           detectedVia: 'google_places',
           ...estimates,
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

   // Heuristic estimates for channel and revenue based on category
   const estimates = getHeuristicEstimates(category);
   res.json({ name, address: address || '', category, detectedVia: 'regex', ...estimates });
 });

// Helper: return plausible channel and revenue range for a business category
function getHeuristicEstimates(category) {
  const map = {
    'Bakery':    { channel: 'WhatsApp orders + local delivery', estimatedRevenue: '₹80K–1.5L' },
    'Café':      { channel: 'In-store + Swiggy/Zomato',       estimatedRevenue: '₹1.5L–3L' },
    'Pharmacy':  { channel: 'Walk-in + home delivery',        estimatedRevenue: '₹2L–5L' },
    'Retail':    { channel: 'In-store walk-ins + WhatsApp',   estimatedRevenue: '₹2L–4.5L' },
    'Restaurant':{ channel: 'Swiggy/Zomato + dine-in',        estimatedRevenue: '₹3L–6L' },
    'Salon':     { channel: 'Appointments + walk-ins',        estimatedRevenue: '₹1.2L–2.5L' },
    'Fitness':   { channel: 'Membership + personal training', estimatedRevenue: '₹1.5L–4L' },
    'Grocery':   { channel: 'In-store + home delivery',        estimatedRevenue: '₹2L–5L' },
    'Hardware':  { channel: 'B2B orders + retail',             estimatedRevenue: '₹1.5L–4L' },
    'Business':  { channel: 'Mixed channels',                 estimatedRevenue: '₹50K–2L' },
    'Service Business': { channel: 'Client visits + contracts', estimatedRevenue: '₹1L–3L' },
    'Import/Export': { channel: 'B2B invoices + freight',      estimatedRevenue: '₹5L–20L' },
  };
  return map[category] || map['Business'];
}

module.exports = {
  getBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  detectBusiness,
};

