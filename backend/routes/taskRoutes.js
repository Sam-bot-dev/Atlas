const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { getTasks, patchTaskStatus } = require('../controllers/taskController');

router.route('/').get(protect, getTasks);
router.route('/:taskId/status').patch(protect, patchTaskStatus);

module.exports = router;

