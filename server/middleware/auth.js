const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db/database');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = Buffer.from(testHash, 'hex');
  if (hashBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, testBuf);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status,
      full_name: user.full_name,
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, full_name, role, subscription_tier, subscription_status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource. Please log in.',
    });
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

function requireSubscription(...allowedTiers) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
      });
    }

    // Admins and editors always have full subscription access
    if (req.user.role === 'admin' || req.user.role === 'editor') {
      return next();
    }

    if (req.user.subscription_status !== 'active') {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'An active subscription is required to access this feature.',
        currentStatus: req.user.subscription_status,
      });
    }

    if (allowedTiers.length > 0 && !allowedTiers.includes(req.user.subscription_tier)) {
      return res.status(403).json({
        error: 'Subscription Upgrade Required',
        message: `This feature requires a ${allowedTiers.join(' or ')} plan. You are on the ${req.user.subscription_tier} plan.`,
        requiredTiers: allowedTiers,
        currentTier: req.user.subscription_tier,
      });
    }

    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateUser,
  requireAuth,
  requireRole,
  requireSubscription,
};
