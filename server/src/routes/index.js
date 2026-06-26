const express = require('express');
const usersRouter = require('./users');
const productsRouter = require('./products');
const cartsRouter = require('./carts');
const ordersRouter = require('./orders');
const adminRouter = require('./admin');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

router.use('/users', usersRouter);
router.use('/products', productsRouter);
router.use('/carts', cartsRouter);
router.use('/orders', ordersRouter);
router.use('/admin', adminRouter);

module.exports = router;
