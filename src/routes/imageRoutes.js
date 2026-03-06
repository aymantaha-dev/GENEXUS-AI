const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { validateImageGeneration } = require('../utils/validation');
const { body, validationResult } = require('express-validator');

// GET available image models
router.get('/models', imageController.getAvailableModels);

// GET image generation (browser friendly)
router.get('/generate', imageController.getImage);

// POST image generation
router.post('/generate', validateImageGeneration, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      status: 400 
    });
  }
  next();
}, imageController.generateImage);

module.exports = router;