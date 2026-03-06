const express = require('express');
const router = express.Router();
const editController = require('../controllers/editController');
const { validateFileUpload } = require('../utils/validation');

// POST image editing
router.post('/image', validateFileUpload, editController.editImage);

module.exports = router;