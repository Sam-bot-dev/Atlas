const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInsights, createInsight } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInsights).post(protect, createInsight);

module.exports = router;
