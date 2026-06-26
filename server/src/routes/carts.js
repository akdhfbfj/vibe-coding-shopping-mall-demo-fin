const express = require('express');
const cartController = require('../controllers/cartController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, cartController.getCart);
router.post('/items', protect, cartController.addCartItem);
router.put('/items/:itemId', protect, cartController.updateCartItem);
router.delete('/items/:itemId', protect, cartController.removeCartItem);
router.delete('/', protect, cartController.clearCart);

module.exports = router;
