const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    return next(new Error('Not authorized — no token'));
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      return next(new Error('User belonging to this token no longer exists'));
    }

    next();
  } catch {
    res.status(401);
    next(new Error('Not authorized — token invalid or expired'));
  }
};

module.exports = { protect };
