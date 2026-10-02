const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { ADMIN_ROLE } = require('../models/tables');
const { parseStoredPermissions } = require('../utils/menuPermissions');

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

    // Permissions are read on every request rather than trusted from the token,
    // so a grant revoked mid-session takes effect immediately
    const result = await pool.query(
      'SELECT id, username, role, is_active, permissions FROM users WHERE id = $1',
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
      isAdmin: user.role === ADMIN_ROLE,
      // Administrators hold every menu implicitly, which is why they are stored
      // with an empty list
      permissions: user.role === ADMIN_ROLE ? [] : parseStoredPermissions(user.permissions)
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

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Gates a router on the menu keys that need it. Read and write are listed
 * separately because several menus share one endpoint - "Customer Data" and
 * "New Entries" both read /entries, but only "New Entries" may write it.
 *
 * An omitted or empty list means staff cannot reach the endpoint at all, so a
 * newly added router fails closed rather than open.
 */
const requireMenuAccess = ({ read, write } = {}) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  if (req.user.isAdmin) {
    return next();
  }

  const allowed = READ_METHODS.has(req.method) ? read : write;

  const granted = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  const hasAccess = Array.isArray(allowed) && allowed.some((key) => granted.includes(key));

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to use this feature. Ask an administrator for access.',
      code: 'PERMISSION_DENIED',
      requiredAnyOf: Array.isArray(allowed) ? allowed : []
    });
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireMenuAccess,
  getTokenFromRequest,
  getJwtSecret
};