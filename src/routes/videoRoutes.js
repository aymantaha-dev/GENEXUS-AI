const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { validateVideoGeneration } = require('../utils/validation');
const { body, validationResult } = require('express-validator');

// GET available video models
router.get('/models', videoController.getAvailableModels);

// GET video generation (browser friendly)
router.get('/generate', videoController.getVideo);

// POST video generation
router.post('/generate', validateVideoGeneration, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array(),
      status: 400 
    });
  }
  next();
}, videoController.generateVideo);

module.exports = router;