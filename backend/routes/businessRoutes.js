const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('express-rate-limit');
const {
  getBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  detectBusiness,
} = require('../controllers/businessController');

const router = express.Router();

// Detect is public (called during onboarding before account creation)
// but rate-limited to prevent abuse
const detectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many detect requests, please slow down.' },
});

router.post('/detect', detectLimiter, detectBusiness);
router.route('/').get(protect, getBusinesses).post(protect, createBusiness);
router.route('/:id').get(protect, getBusiness).patch(protect, updateBusiness);

module.exports = router;

