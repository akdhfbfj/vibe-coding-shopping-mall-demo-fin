const mongoose = require('mongoose');
const Product = require('../models/Product');

const { PRODUCT_CATEGORIES } = Product;

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: '이미 사용 중인 SKU입니다.' });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};

const getProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      if (!PRODUCT_CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({
          message: 'Category must be one of: 상의, 하의, 악세사리',
        });
      }
      filter.category = req.query.category;
    }

    if (req.query.search?.trim()) {
      filter.name = { $regex: req.query.search.trim(), $options: 'i' };
    }

    if (req.query.all === 'true') {
      const products = await Product.find(filter).sort({ createdAt: -1 });
      const total = products.length;

      return res.json({
        products,
        pagination: {
          page: 1,
          limit: total,
          total,
          totalPages: 1,
        },
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 5);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      products,
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

const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
};

const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, description } = req.body;

    if (!sku?.trim()) {
      return res.status(400).json({ message: 'SKU를 입력해주세요.' });
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: '상품 이름을 입력해주세요.' });
    }

    const priceValue = typeof price === 'string' ? Number(price) : price;

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ message: '상품 가격을 입력해주세요.' });
    }

    if (typeof priceValue !== 'number' || Number.isNaN(priceValue) || priceValue < 0) {
      return res.status(400).json({ message: '상품 가격은 0 이상의 숫자여야 합니다.' });
    }

    if (!category) {
      return res.status(400).json({ message: '카테고리를 선택해주세요.' });
    }

    if (!PRODUCT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: 'Category must be one of: 상의, 하의, 악세사리',
      });
    }

    if (!image?.trim()) {
      return res.status(400).json({ message: '상품 이미지를 입력해주세요.' });
    }

    const product = await Product.create({
      sku: sku.trim(),
      name: name.trim(),
      price: priceValue,
      category,
      image: image.trim(),
      description: description?.trim() || undefined,
    });

    res.status(201).json(product);
  } catch (error) {
    handleError(res, error);
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const { sku, name, price, category, image, description } = req.body;
    const updateData = {};

    if (sku !== undefined) {
      if (!sku?.trim()) {
        return res.status(400).json({ message: 'SKU를 입력해주세요.' });
      }
      updateData.sku = sku.trim();
    }

    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({ message: '상품 이름을 입력해주세요.' });
      }
      updateData.name = name.trim();
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        return res.status(400).json({ message: '상품 가격은 0 이상의 숫자여야 합니다.' });
      }
      updateData.price = price;
    }

    if (category !== undefined) {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: 'Category must be one of: 상의, 하의, 악세사리',
        });
      }
      updateData.category = category;
    }

    if (image !== undefined) {
      if (!image?.trim()) {
        return res.status(400).json({ message: '상품 이미지를 입력해주세요.' });
      }
      updateData.image = image.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
