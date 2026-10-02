const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { getJwtSecret } = require('../middleware/auth');
const { ADMIN_ROLE } = require('../models/tables');
const { parsePermissions } = require('./userController');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name || '',
  role: user.role,
  isActive: user.is_active,
  permissions: user.role === ADMIN_ROLE ? [] : parsePermissions(user.permissions),
  profileImage: user.profile_image || null,
  mustChangePassword: Boolean(user.must_change_password),
  passwordChangedAt: user.password_changed_at || null,
  lastLoginAt: user.last_login_at || null,
  createdAt: user.created_at || null
});

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Query user
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Deactivated accounts are refused before the password is even checked
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Contact an administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = signToken(user);

    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: toPublicUser({ ...user, last_login_at: new Date().toISOString() })
    });

  } catch (err) {
    console.error('Login error:', err);
    handleDatabaseError(err, res, 'Login failed');
  }
};

// Create a new user (for development/testing)
const createUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username
      }
    });

  } catch (err) {
    console.error('Create user error:', err);
    handleDatabaseError(err, res, 'Failed to create user');
  }
};

// Return the account details of the currently logged in user
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, role, permissions, profile_image, is_active,
              must_change_password, password_changed_at, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      user: toPublicUser(user)
    });
  } catch (err) {
    console.error('Get profile error:', err);
    handleDatabaseError(err, res, 'Failed to load account details');
  }
};

// Replace the password of the currently logged in user
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      'SELECT id, username, password, must_change_password FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // The current password is only verifiable when the account is not flagged for a
    // forced change - in that flow the session was just authenticated with it.
    if (currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }
    } else if (!user.must_change_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required',
        code: 'CURRENT_PASSWORD_REQUIRED'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateResult = await pool.query(
      `UPDATE users
       SET password = $1,
           must_change_password = FALSE,
           password_changed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, full_name, role, permissions, profile_image, is_active,
                 must_change_password, password_changed_at, last_login_at, created_at`,
      [hashedPassword, user.id]
    );

    // Re-issue the token so the refreshed account claims are carried by the session
    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token,
      user: toPublicUser(updateResult.rows[0])
    });
  } catch (err) {
    console.error('Change password error:', err);
    handleDatabaseError(err, res, 'Failed to update password');
  }
};

module.exports = {
  login,
  createUser,
  getProfile,
  changePassword
};
