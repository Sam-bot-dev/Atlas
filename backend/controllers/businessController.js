const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

// @desc    Register a new business
// @route   POST /api/v1/businesses
// @access  Private
const registerBusiness = asyncHandler(async (req, res) => {
  const { name, category, placeId, address, goals, type, location } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide a business name and category');
  }

  const business = await prisma.business.create({
    data: {
      name,
      category,
      type: type || category || '',
      location: location || address || '',
      owner: req.user.name || '',
      initials: name.slice(0, 2).toUpperCase(),
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
      type: b.type,
      location: b.location,
      owner: b.owner,
      initials: b.initials,
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

  const { name, category, placeId, address, goals, type, location, owner, initials, color } = req.body;

  const updated = await prisma.business.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(type !== undefined && { type }),
      ...(location !== undefined && { location }),
      ...(owner !== undefined && { owner }),
      ...(initials !== undefined && { initials }),
      ...(color !== undefined && { color }),
      ...(placeId !== undefined && { placeId }),
      ...(address !== undefined && { address }),
      ...(goals !== undefined && { goals: JSON.stringify(goals) }),
    },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    category: updated.category,
    type: updated.type,
    location: updated.location,
    owner: updated.owner,
    initials: updated.initials,
    color: updated.color,
    address: updated.address,
    goals: JSON.parse(updated.goals),
  });
});

const detectBusiness = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const address = String(req.body.address || '').trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_VISION_API_KEY;

  let details = {
    name,
    address,
    category: 'Service Business',
    placeId: '',
    rating: 0,
    reviews: 0,
    confidence: name ? 0.4 : 0.1,
    isFallback: true
  };

  if (apiKey && name) {
    try {
      const query = encodeURIComponent(`${name} ${address}`);
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=name,formatted_address,types,rating,user_ratings_total,place_id&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        const place = data.candidates[0];
        const types = place.types || [];
        
        let category = 'Service Business';
        if (types.includes('bakery')) category = 'Home Baker';
        else if (types.includes('cafe') || types.includes('coffee_shop')) category = 'Cafe';
        else if (types.includes('pharmacy') || types.includes('drugstore') || types.includes('health')) category = 'Pharmacy';
        else if (types.includes('clothing_store') || types.includes('shoe_store') || types.includes('jewelry_store') || types.includes('shopping_mall')) category = 'Retail Shop';
        else if (types.includes('gym') || types.includes('health_club') || types.includes('fitness_center')) category = 'Gym/Fitness';
        else if (types.includes('beauty_salon') || types.includes('hair_care') || types.includes('spa')) category = 'Salon/Spa';
        else if (types.includes('restaurant') || types.includes('meal_takeaway')) category = 'Restaurant';
        else if (types.includes('logistics') || types.includes('moving_company') || types.includes('storage')) category = 'Import/Export';
        else if (types.includes('electronics_store') || types.includes('home_goods_store')) category = 'Retail Shop';

        details = {
          name: place.name || name,
          address: place.formatted_address || address,
          category,
          placeId: place.place_id,
          rating: place.rating || 0,
          reviews: place.user_ratings_total || 0,
          confidence: 0.95,
          isFallback: false
        };
      }
    } catch (error) {
      console.error('Google Places API Error:', error);
    }
  }

  // Fallback regex if API failed or no key
  if (details.isFallback) {
    const text = `${name} ${address}`.toLowerCase();
    if (/baker|bakery|cake|bread/.test(text)) details.category = 'Home Baker';
    if (/cafe|coffee|tea/.test(text)) details.category = 'Cafe';
    if (/pharmacy|chemist|medical/.test(text)) details.category = 'Pharmacy';
    if (/retail|store|shop|mart/.test(text)) details.category = 'Retail Shop';
    if (/import|export|logistics|freight/.test(text)) details.category = 'Import/Export';
    details.confidence = name ? 0.72 : 0.4;
  }

  res.json({
    ...details,
    type: details.category,
    location: details.address,
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
  detectBusiness,
};
