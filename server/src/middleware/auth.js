const User = require('../models/User');
const { verifyToken, extractBearerToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('_id user_type');

    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    req.user = {
      id: user._id.toString(),
      user_type: user.user_type,
    };

    next();
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured') {
      console.error(error.message);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '토큰이 만료되었습니다. 다시 로그인해주세요.' });
    }

    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = protect;
