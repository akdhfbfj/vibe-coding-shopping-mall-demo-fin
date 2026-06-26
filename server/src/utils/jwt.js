const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
};

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      user_type: user.user_type,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const extractBearerToken = (authHeader) => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

module.exports = {
  generateToken,
  verifyToken,
  extractBearerToken,
  getJwtSecret,
};
