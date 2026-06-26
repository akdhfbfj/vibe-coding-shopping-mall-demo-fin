const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const populateCartItems = {
  path: 'items.product',
  select: 'sku name price category image description',
};

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Cart already exists for this user.' });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(populateCartItems);

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate(populateCartItems);
  }

  return cart;
};

const parseQuantity = (quantity, res) => {
  const quantityValue = typeof quantity === 'string' ? Number.parseInt(quantity, 10) : quantity;

  if (
    quantity === undefined ||
    quantity === null ||
    quantity === '' ||
    !Number.isInteger(quantityValue) ||
    quantityValue < 1
  ) {
    res.status(400).json({ message: '수량은 1 이상의 정수여야 합니다.' });
    return null;
  }

  return quantityValue;
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (error) {
    handleError(res, error);
  }
};

const addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const quantityValue = parseQuantity(quantity, res);
    if (quantityValue === null) {
      return;
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantityValue;
    } else {
      cart.items.push({ product: productId, quantity: quantityValue });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(populateCartItems);
    res.status(201).json(populatedCart);
  } catch (error) {
    handleError(res, error);
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid cart item ID' });
    }

    const quantityValue = parseQuantity(quantity, res);
    if (quantityValue === null) {
      return;
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = quantityValue;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(populateCartItems);
    res.json(populatedCart);
  } catch (error) {
    handleError(res, error);
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid cart item ID' });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.deleteOne();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(populateCartItems);
    res.json(populatedCart);
  } catch (error) {
    handleError(res, error);
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.json({ user: req.user.id, items: [] });
    }

    cart.items = [];
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(populateCartItems);
    res.json(populatedCart);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
