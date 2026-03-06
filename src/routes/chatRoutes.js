const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateChatGeneration } = require('../utils/validation');
const { body, validationResult } = require('express-validator');

// GET available chat models
router.get('/models', chatController.getAvailableModels);

// GET chat endpoint (browser friendly)
router.get('/chat', chatController.chat);

// POST chat generation
router.post('/chat', validateChatGeneration, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      status: 400 
    });
  }
  next();
}, chatController.generateText);

module.exports = router;