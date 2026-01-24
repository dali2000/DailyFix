const { protect } = require('./auth.middleware');

// Middleware to check if user is admin
// This should be used AFTER protect middleware
const admin = (req, res, next) => {
  // Check if user is admin (protect middleware should have already set req.user)
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

module.exports = { admin };

