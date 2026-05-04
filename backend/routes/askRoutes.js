/**
 * Public Ask endpoint — accepts full business context in the request body.
 * No authentication required so demo businesses (which have no DB record)
 * can query the AI with their full client-side context.
 *
 * POST /api/v1/ask
 * Body: { query: string, business: BusinessObject }
 */

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const asyncHandler = require('express-async-handler');
const { publicAskAtlas } = require('../services/insightService');

const router = express.Router();

// Stricter rate limit than auth'd endpoints — public, so more abuse-prone
const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many questions, please slow down.' },
});

router.post('/', askLimiter, asyncHandler(async (req, res) => {
  const query = String(req.body.query || '').trim();
  const business = req.body.business;

  if (!query) {
    res.status(400);
    throw new Error('query is required');
  }

  if (!business || typeof business !== 'object') {
    res.status(400);
    throw new Error('business context is required');
  }

  const result = await publicAskAtlas(business, query);
  res.json(result);
}));

module.exports = router;
