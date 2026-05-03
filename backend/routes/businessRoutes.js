const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  detectBusiness,
} = require('../controllers/businessController');

const router = express.Router();

// detect is public — called during onboarding before the user has an account
router.post('/detect', detectBusiness);
router.route('/').get(protect, getBusinesses).post(protect, createBusiness);
router.route('/:id').get(protect, getBusiness).patch(protect, updateBusiness);

module.exports = router;

