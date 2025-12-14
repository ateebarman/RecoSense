const express = require('express');
const router = express.Router();
const { getUserReviews, getReviewsForProduct, addReview } = require('../controllers/reviewController');

// Order matters: specific routes first, then general/parameterized routes.
router.post('/', addReview);
router.get('/product/:asin', getReviewsForProduct);
router.get('/:user_id', getUserReviews);

module.exports = router;