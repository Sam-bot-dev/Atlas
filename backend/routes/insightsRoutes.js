const express = require('express');
const router = express.Router({ mergeParams: true });
const { getInsights, createInsight, explainInsight } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInsights).post(protect, createInsight);
router.route('/:insightId/explain').get(protect, explainInsight);

module.exports = router;
