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

router.route('/').get(protect, getBusinesses).post(protect, createBusiness);
router.post('/detect', protect, detectBusiness);
router.route('/:id').get(protect, getBusiness).patch(protect, updateBusiness);

module.exports = router;

