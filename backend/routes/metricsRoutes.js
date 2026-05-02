const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives us :bizId
const { getMetrics, upsertMetric, getForecast, getMetricSeries, getPeakHours } = require('../controllers/metricsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMetrics);
router.route('/forecast').get(protect, getForecast);
router.route('/peak-hours').get(protect, getPeakHours);
router.route('/series/:metric').get(protect, getMetricSeries);
router.route('/:key').put(protect, upsertMetric);

module.exports = router;
