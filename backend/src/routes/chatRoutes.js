const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

// POST /api/chat
router.post('/chat', handleChat);

module.exports = router;
