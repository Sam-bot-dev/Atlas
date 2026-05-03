const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives us :bizId
const { getMetrics, upsertMetric, getForecast, getMetricSeries, getPeakHours, importMetricsFromExcel } = require('../controllers/metricsController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for Excel file uploads
const upload = multer({ dest: 'uploads/', fileFilter: (req, file, cb) => {
  if (file.mimetype.includes('spreadsheet') || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed'));
  }
}});

router.route('/').get(protect, getMetrics);
router.route('/forecast').get(protect, getForecast);
router.route('/peak-hours').get(protect, getPeakHours);
router.route('/import-excel').post(protect, upload.single('file'), importMetricsFromExcel);
router.route('/series/:metric').get(protect, getMetricSeries);
router.route('/:key').put(protect, upsertMetric);

module.exports = router;
