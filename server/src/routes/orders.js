const express = require('express');
const orderController = require('../controllers/orderController');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/:id', protect, orderController.getOrderById);
router.patch('/:id', protect, orderController.updateOrder);
router.delete('/:id', protect, adminOnly, orderController.deleteOrder);

module.exports = router;
