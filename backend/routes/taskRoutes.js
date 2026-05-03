const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { getTasks, patchTaskStatus, postTask, deleteTask } = require('../controllers/taskController');

router.route('/').get(protect, getTasks).post(protect, postTask);
router.route('/:taskId').delete(protect, deleteTask);
router.route('/:taskId/status').patch(protect, patchTaskStatus);

module.exports = router;

