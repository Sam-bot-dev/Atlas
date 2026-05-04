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
// @access  Public (called during onboarding before account creation)
const detectBusiness = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400);
    throw new Error('Business name is required');
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (apiKey) {
    try {
      // Use Places API (New) — searchText endpoint (v1, not deprecated findplacefromtext)
      const query = `${name.trim()} ${(address || '').trim()}`.trim();
      const placesRes = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            // Only request the fields we need — minimises billing cost
            'X-Goog-FieldMask': 'places.displayName,places.types,places.formattedAddress,places.primaryType',
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: 'en',
            regionCode: 'IN',
            maxResultCount: 1,
          }),
        }
      );

      if (!placesRes.ok) {
        const errBody = await placesRes.text().catch(() => '');
        console.error('[detectBusiness] Places API HTTP error:', placesRes.status, errBody.slice(0, 200));
        // Fall through to regex
      } else {
        const data = await placesRes.json();
        const place = data.places?.[0];

        if (place) {
          const category = mapPlaceTypeToCategory(place.primaryType, place.types);
          const estimates = getHeuristicEstimates(category);
          return res.json({
            // Return the user's original name — don't overwrite what they typed
            name: name.trim(),
            address: place.formattedAddress || address || '',
            category,
            detectedVia: 'google_places',
            placeTypes: place.types || [],
            ...estimates,
          });
        }
      }
    } catch (err) {
      console.error('[detectBusiness] Places API error:', err.message);
      // Fall through to regex fallback
    }
  }

  // Deterministic regex fallback — works without any API key
  const lower = name.toLowerCase();
  let category = 'Business';
  if (/bak[e]?ry|cake|sweets|mithai|confection/.test(lower))       category = 'Bakery';
  else if (/pharmacy|medical|chemist|drug|medicine/.test(lower))   category = 'Pharmacy';
  else if (/cafe|coffee|chai|tea stall/.test(lower))               category = 'Café';
  else if (/salon|spa|beauty|hair|parlour/.test(lower))            category = 'Salon';
  else if (/restaurant|hotel|dhaba|biryani|tiffin|food/.test(lower)) category = 'Restaurant';
  else if (/gym|fitness|yoga|wellness/.test(lower))                category = 'Fitness';
  else if (/shop|store|mart|retail|boutique|textiles/.test(lower)) category = 'Retail';
  else if (/export|import|trade|logistics|freight/.test(lower))    category = 'Import/Export';
  else if (/interior|design|architect|contractor/.test(lower))     category = 'Service Business';
  else if (/clinic|hospital|doctor|dental/.test(lower))            category = 'Pharmacy';
  else if (/school|tuition|coaching|academy/.test(lower))          category = 'Service Business';

  const estimates = getHeuristicEstimates(category);
  res.json({ name: name.trim(), address: address || '', category, detectedVia: 'regex', ...estimates });
});

// Map Google Places primaryType / types array → Atlas category
function mapPlaceTypeToCategory(primaryType, types = []) {
  const all = [primaryType, ...types].filter(Boolean).map(t => t.toLowerCase());

  const rules = [
    { patterns: ['bakery', 'cake_shop', 'confectionery'],                    category: 'Bakery' },
    { patterns: ['pharmacy', 'drugstore', 'medical_supply_store'],           category: 'Pharmacy' },
    { patterns: ['cafe', 'coffee_shop', 'tea_house'],                        category: 'Café' },
    { patterns: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'],    category: 'Restaurant' },
    { patterns: ['beauty_salon', 'hair_care', 'spa', 'nail_salon'],          category: 'Salon' },
    { patterns: ['gym', 'fitness_center', 'yoga_studio', 'sports_complex'],  category: 'Fitness' },
    { patterns: ['clothing_store', 'shoe_store', 'jewelry_store',
                 'home_goods_store', 'furniture_store', 'hardware_store',
                 'electronics_store', 'book_store', 'department_store',
                 'shopping_mall', 'supermarket', 'grocery_or_supermarket'],  category: 'Retail' },
    { patterns: ['moving_company', 'storage', 'freight', 'courier'],         category: 'Import/Export' },
    { patterns: ['general_contractor', 'interior_design', 'plumber',
                 'electrician', 'painter', 'roofing_contractor'],            category: 'Service Business' },
  ];

  for (const rule of rules) {
    if (rule.patterns.some(p => all.some(t => t.includes(p)))) {
      return rule.category;
    }
  }
  return 'Business';
}

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

