const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives us :bizId
const { getMetrics, upsertMetric, getForecast } = require('../controllers/metricsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMetrics);
router.route('/forecast').get(protect, getForecast);
router.route('/:key').put(protect, upsertMetric);

module.exports = router;
