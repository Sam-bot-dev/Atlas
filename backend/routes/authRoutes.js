const express = require('express');
const router = express.Router();
const { loginUser, signupUser, getMe, logoutUser, firebaseLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.post('/firebase', firebaseLogin);

module.exports = router;
