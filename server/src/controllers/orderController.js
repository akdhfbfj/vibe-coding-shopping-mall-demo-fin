const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { PaymentVerificationError, verifyPortOnePayment } = require('../utils/verifyPortOnePayment');

const { ORDER_STATUSES, PAYMENT_METHODS } = Order;

const FREE_SHIPPING_THRESHOLD = 50000;
const DEFAULT_SHIPPING_FEE = 3000;

const populateOrder = [
  { path: 'user', select: 'name email' },
  { path: 'items.product', select: 'sku name price image category' },
];

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (error.code === 11000) {
    if (error.keyPattern?.['payment.transactionId']) {
      return res.status(409).json({ message: '이미 처리된 결제입니다.' });
    }

    return res.status(409).json({ message: '이미 사용 중인 주문 번호입니다.' });
  }

  if (error instanceof PaymentVerificationError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};

const generateOrderNumber = async () => {
  const today = new Date();
  const datePart = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');

  const prefix = `ORD-${datePart}-`;
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  return `${prefix}${String(todayCount + 1).padStart(4, '0')}`;
};

const validateShippingAddress = (shippingAddress, res) => {
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    res.status(400).json({ message: '배송지 정보를 입력해주세요.' });
    return null;
  }

  const { recipientName, phone, postalCode, address } = shippingAddress;

  if (!recipientName?.trim()) {
    res.status(400).json({ message: '수령인 이름을 입력해주세요.' });
    return null;
  }

  if (!phone?.trim()) {
    res.status(400).json({ message: '연락처를 입력해주세요.' });
    return null;
  }

  if (!postalCode?.trim()) {
    res.status(400).json({ message: '우편번호를 입력해주세요.' });
    return null;
  }

  if (!address?.trim()) {
    res.status(400).json({ message: '주소를 입력해주세요.' });
    return null;
  }

  return {
    recipientName: recipientName.trim(),
    phone: phone.trim(),
    postalCode: postalCode.trim(),
    address: address.trim(),
    addressDetail: shippingAddress.addressDetail?.trim() || undefined,
    deliveryMemo: shippingAddress.deliveryMemo?.trim() || undefined,
  };
};

const buildOrderItemsFromCart = async (cartItems, res) => {
  const orderItems = [];

  for (const cartItem of cartItems) {
    const product = await Product.findById(cartItem.product);

    if (!product) {
      res.status(400).json({ message: '장바구니에 존재하지 않는 상품이 포함되어 있습니다.' });
      return null;
    }

    orderItems.push({
      product: product._id,
      sku: product.sku,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: cartItem.quantity,
      lineTotal: product.price * cartItem.quantity,
    });
  }

  return orderItems;
};

const calculateAmounts = (orderItems, discountAmount = 0) => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const safeDiscount = Math.max(0, discountAmount);
  const totalAmount = Math.max(0, subtotal + shippingFee - safeDiscount);

  return { subtotal, shippingFee, discountAmount: safeDiscount, totalAmount };
};

const canAccessOrder = (order, user) => {
  return user.user_type === 'admin' || order.user.toString() === user.id;
};

const findOrderByTransactionId = async (transactionId) => {
  const normalizedTransactionId = transactionId?.trim();

  if (!normalizedTransactionId) {
    return null;
  }

  return Order.findOne({ 'payment.transactionId': normalizedTransactionId });
};

const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, discountAmount = 0, transactionId } = req.body;

    const validatedAddress = validateShippingAddress(shippingAddress, res);
    if (!validatedAddress) {
      return;
    }

    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Payment method must be one of: card, bank_transfer, kakao_pay',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: '장바구니가 비어 있습니다.' });
    }

    const orderItems = await buildOrderItemsFromCart(cart.items, res);
    if (!orderItems) {
      return;
    }

    const amounts = calculateAmounts(orderItems, discountAmount);
    const isFreeOrder = amounts.totalAmount === 0;
    let normalizedTransactionId = transactionId?.trim();

    if (isFreeOrder) {
      normalizedTransactionId = normalizedTransactionId || `FREE-${req.user.id}-${Date.now()}`;
    } else if (!normalizedTransactionId) {
      return res.status(400).json({ message: '결제 거래 ID가 필요합니다.' });
    }

    const existingOrder = await findOrderByTransactionId(normalizedTransactionId);

    if (existingOrder) {
      if (existingOrder.user.toString() !== req.user.id) {
        return res.status(409).json({ message: '이미 처리된 결제입니다.' });
      }

      const populatedExistingOrder = await Order.findById(existingOrder._id).populate(populateOrder);
      return res.status(200).json(populatedExistingOrder);
    }

    if (!isFreeOrder) {
      await verifyPortOnePayment(normalizedTransactionId, amounts.totalAmount);
    }

    const orderNumber = await generateOrderNumber();

    let order;

    try {
      order = await Order.create({
        orderNumber,
        user: req.user.id,
        items: orderItems,
        shippingAddress: validatedAddress,
        payment: {
          method: paymentMethod,
          status: 'completed',
          paidAt: new Date(),
          transactionId: normalizedTransactionId,
        },
        status: 'paid',
        ...amounts,
      });
    } catch (createError) {
      if (createError.code === 11000 && createError.keyPattern?.['payment.transactionId']) {
        const duplicateOrder = await findOrderByTransactionId(normalizedTransactionId);

        if (duplicateOrder && duplicateOrder.user.toString() === req.user.id) {
          const populatedDuplicateOrder = await Order.findById(duplicateOrder._id).populate(
            populateOrder
          );
          return res.status(200).json(populatedDuplicateOrder);
        }
      }

      throw createError;
    }

    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id).populate(populateOrder);
    res.status(201).json(populatedOrder);
  } catch (error) {
    handleError(res, error);
  }
};

const getOrders = async (req, res) => {
  try {
    const filter = req.user.user_type === 'admin' ? {} : { user: req.user.id };

    if (req.query.status) {
      if (!ORDER_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          message:
            'Order status must be one of: pending, paid, processing, shipment_started, shipping, delivered, completed, cancelled',
        });
      }
      filter.status = req.query.status;
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate(populateOrder).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id).populate(populateOrder);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ message: '주문 조회 권한이 없습니다.' });
    }

    res.json(order);
  } catch (error) {
    handleError(res, error);
  }
};

const updateOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { status, cancelReason } = req.body;

    if (req.user.user_type === 'admin') {
      if (status === undefined) {
        return res.status(400).json({ message: '변경할 주문 상태를 입력해주세요.' });
      }

      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          message:
            'Order status must be one of: pending, paid, processing, shipment_started, shipping, delivered, completed, cancelled',
        });
      }

      order.status = status;

      if (status === 'cancelled') {
        order.cancelledAt = new Date();
        if (cancelReason?.trim()) {
          order.cancelReason = cancelReason.trim();
        }
      }
    } else {
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({ message: '주문 수정 권한이 없습니다.' });
      }

      if (status !== 'cancelled') {
        return res.status(403).json({ message: '고객은 주문 취소만 요청할 수 있습니다.' });
      }

      if (!['pending', 'paid'].includes(order.status)) {
        return res.status(400).json({ message: '현재 상태에서는 주문을 취소할 수 없습니다.' });
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = cancelReason?.trim() || '고객 요청 취소';
      order.payment.status = 'refunded';
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id).populate(populateOrder);
    res.json(populatedOrder);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
