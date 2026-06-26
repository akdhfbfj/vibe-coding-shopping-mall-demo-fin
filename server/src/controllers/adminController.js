const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const STATUS_LABELS = {
  pending: '대기',
  paid: '주문 확인',
  processing: '상품 준비중',
  shipment_started: '배송 시작',
  shipping: '배송 중',
  delivered: '배송 완료',
  completed: '배송 완료',
  cancelled: '주문 취소',
};

const STATUS_CLASSES = {
  pending: 'processing',
  paid: 'processing',
  processing: 'processing',
  shipment_started: 'shipping',
  shipping: 'shipping',
  delivered: 'completed',
  completed: 'completed',
  cancelled: 'processing',
};

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { start, end };
};

const formatTrend = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? '지난달 대비 신규' : '지난달과 동일';
  }

  const change = Math.round(((current - previous) / previous) * 100);
  const sign = change >= 0 ? '+' : '';

  return `지난달 대비 ${sign}${change}%`;
};

const countInRange = (Model, filter, start, end) =>
  Model.countDocuments({
    ...filter,
    createdAt: { $gte: start, $lt: end },
  });

const sumRevenueInRange = async (start, end) => {
  const result = await Order.aggregate([
    {
      $match: {
        status: { $ne: 'cancelled' },
        'payment.status': 'completed',
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
      },
    },
  ]);

  return result[0]?.total || 0;
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = getMonthRange(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = getMonthRange(lastMonthDate);

    const orderFilter = { status: { $ne: 'cancelled' } };
    const customerFilter = { user_type: 'customer' };

    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueResult,
      recentOrders,
      ordersThisMonth,
      ordersLastMonth,
      productsThisMonth,
      productsLastMonth,
      customersThisMonth,
      customersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      Order.countDocuments(orderFilter),
      Product.countDocuments(),
      User.countDocuments(customerFilter),
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            'payment.status': 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.find(orderFilter)
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(4),
      countInRange(Order, orderFilter, thisMonth.start, thisMonth.end),
      countInRange(Order, orderFilter, lastMonth.start, lastMonth.end),
      countInRange(Product, {}, thisMonth.start, thisMonth.end),
      countInRange(Product, {}, lastMonth.start, lastMonth.end),
      countInRange(User, customerFilter, thisMonth.start, thisMonth.end),
      countInRange(User, customerFilter, lastMonth.start, lastMonth.end),
      sumRevenueInRange(thisMonth.start, thisMonth.end),
      sumRevenueInRange(lastMonth.start, lastMonth.end),
    ]);

    res.json({
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue: revenueResult[0]?.total || 0,
        trends: {
          orders: formatTrend(ordersThisMonth, ordersLastMonth),
          products: formatTrend(productsThisMonth, productsLastMonth),
          customers: formatTrend(customersThisMonth, customersLastMonth),
          revenue: formatTrend(revenueThisMonth, revenueLastMonth),
        },
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.orderNumber,
        customer: order.user?.name || '알 수 없음',
        date: order.createdAt.toISOString().slice(0, 10),
        status: order.status,
        statusLabel: STATUS_LABELS[order.status] || order.status,
        statusClass: STATUS_CLASSES[order.status] || 'processing',
        amount: order.totalAmount,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats,
};
