const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActions, createAction, updateAction, applyAction, createTaskFromAction } = require('../controllers/actionsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getActions).post(protect, createAction);
router.route('/:actionId').patch(protect, updateAction);
router.route('/:actionId/apply').post(protect, applyAction);
router.route('/:actionId/task').post(protect, createTaskFromAction);

module.exports = router;
