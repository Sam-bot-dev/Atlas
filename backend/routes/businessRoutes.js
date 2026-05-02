const express = require('express');
const router = express.Router();
const {
  registerBusiness,
  getBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
} = require('../controllers/businessController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, registerBusiness).get(protect, getBusinesses);
router
  .route('/:id')
  .get(protect, getBusiness)
  .put(protect, updateBusiness)
  .delete(protect, deleteBusiness);

module.exports = router;
