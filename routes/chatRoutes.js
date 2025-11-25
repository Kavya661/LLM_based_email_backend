const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat-based inbox interaction
router.post('/message', chatController.processChatMessage);

// Get chat history
router.get('/history/:emailId', chatController.getChatHistory);

module.exports = router;