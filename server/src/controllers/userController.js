const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

const createUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: '올바른 이메일 형식을 입력해주세요.' });
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: '이름을 입력해주세요.' });
    }

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email: email.trim(),
      name: name.trim(),
      password: hashedPassword,
      user_type: user_type || 'customer',
      address: address?.trim() || undefined,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    handleError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { email, name, password, user_type, address } = req.body;
    const updateData = {};

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (password !== undefined) updateData.password = await hashPassword(password);
    if (user_type !== undefined) updateData.user_type = user_type;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: '올바른 이메일 형식을 입력해주세요.' });
    }

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    let token;

    try {
      token = generateToken(user);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: '로그인에 성공했습니다.',
      token,
      user: userResponse,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  getMe,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
};
