const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create a new order
router.post('/:user_id', orderController.createOrder);

// Get all orders for a user
router.get('/:user_id', orderController.getUserOrders);

// Get order by ID
router.get('/:user_id/order/:orderId', orderController.getOrderById);

// Get order by order number
router.get('/:user_id/number/:orderNumber', orderController.getOrderByNumber);

// Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);

// Cancel order
router.put('/:orderId/cancel', orderController.cancelOrder);

// Get order statistics
router.get('/:user_id/stats', orderController.getOrderStats);

module.exports = router;
