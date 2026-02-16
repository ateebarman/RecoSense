const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const protect = require('../middleware/auth');

// We protect these routes to prevent API key abuse
router.get('/analyze/:asin', protect, aiController.analyzeProduct);
router.post('/ask', protect, aiController.askQuestion);

module.exports = router;
