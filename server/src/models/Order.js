const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipment_started',
  'shipping',
  'delivered',
  'completed',
  'cancelled',
];

const PAYMENT_METHODS = ['card', 'bank_transfer', 'kakao_pay'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price must be 0 or greater'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total must be 0 or greater'],
    },
  },
  {
    _id: true,
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    addressDetail: {
      type: String,
      trim: true,
    },
    deliveryMemo: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: 'Payment method must be one of: card, bank_transfer, kakao_pay',
      },
    },
    status: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: PAYMENT_STATUSES,
        message: 'Payment status must be one of: pending, completed, failed, refunded',
      },
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    transactionId: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    payment: {
      type: paymentSchema,
      required: [true, 'Payment info is required'],
    },
    status: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: ORDER_STATUSES,
        message:
          'Order status must be one of: pending, paid, processing, shipment_started, shipping, delivered, completed, cancelled',
      },
      default: 'pending',
      index: true,
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal must be 0 or greater'],
    },
    shippingFee: {
      type: Number,
      required: [true, 'Shipping fee is required'],
      min: [0, 'Shipping fee must be 0 or greater'],
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount must be 0 or greater'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be 0 or greater'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ 'payment.transactionId': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
