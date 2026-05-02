const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActions, createAction, updateAction, deleteAction, applyAction, createTaskFromAction } = require('../controllers/actionsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getActions).post(protect, createAction);
router.route('/:actionId').patch(protect, updateAction).delete(protect, deleteAction);
router.route('/:actionId/apply').post(protect, applyAction);
router.route('/:actionId/task').post(protect, createTaskFromAction);

module.exports = router;
