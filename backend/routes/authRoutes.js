const express = require('express');
const router = express.Router();
const { loginUser, signupUser, getMe, updateMe, deleteMe, logoutUser, firebaseLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);
router.post('/firebase', firebaseLogin);

module.exports = router;
