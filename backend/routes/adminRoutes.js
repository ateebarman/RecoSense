const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const requireAdmin = require('../middleware/requireAdmin');

// All routes here require admin privileges
router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.post('/run-model', adminController.runModel);
router.post('/retrain', adminController.triggerRetrain);

module.exports = router;
