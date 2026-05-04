const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getMessages, sendMessage, clearMessages } = require('../controllers/chatController');

const router = express.Router({ mergeParams: true });

router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);
router.delete('/', protect, clearMessages);

module.exports = router;
