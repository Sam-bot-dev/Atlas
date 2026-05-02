const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  listAutomations,
  toggleAutomation,
  addAutomation,
  deleteAutomation,
  suggestedAutomations,
} = require('../controllers/automationsController');

router.route('/').get(protect, listAutomations).post(protect, addAutomation);
router.route('/suggested').get(protect, suggestedAutomations);
router.route('/:autoId').delete(protect, deleteAutomation);
router.route('/:autoId/toggle').patch(protect, toggleAutomation);

module.exports = router;
