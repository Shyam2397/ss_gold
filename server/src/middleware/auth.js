const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { ADMIN_ROLE } = require('../models/tables');

const getJwtSecret = () => process.env.JWT_SECRET || 'your-secret-key';

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
};

const authenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    const result = await pool.query(
      'SELECT id, username, role, is_active FROM users WHERE id = $1',
      [payload.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Contact an administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      isAdmin: user.role === ADMIN_ROLE
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please sign in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid session. Please sign in again.',
      code: 'INVALID_TOKEN'
    });
  }
};

// Guards the endpoints that manage other accounts
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Administrator access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin,
  getTokenFromRequest,
  getJwtSecret
};