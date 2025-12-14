const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Get cart for user
router.get('/:user_id', cartController.getCart);

// Add item to cart
router.post('/:user_id', cartController.addToCart);

// Remove item from cart
router.delete('/:user_id/:asin', cartController.removeFromCart);

// Update item quantity
router.put('/:user_id/:asin', cartController.updateQuantity);

// Clear cart
router.delete('/:user_id', cartController.clearCart);

module.exports = router;
