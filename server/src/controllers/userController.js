const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { ADMIN_ROLE } = require('../models/tables');
const { sanitizePermissions } = require('../utils/menuPermissions');

const ROLES = [ADMIN_ROLE, 'staff'];

const parsePermissions = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name || '',
  role: user.role,
  isActive: user.is_active,
  permissions: user.role === ADMIN_ROLE ? [] : parsePermissions(user.permissions),
  hasProfileImage: Boolean(user.profile_image),
  profileImage: user.profile_image || null,
  mustChangePassword: Boolean(user.must_change_password),
  passwordChangedAt: user.password_changed_at || null,
  lastLoginAt: user.last_login_at || null,
  createdAt: user.created_at || null
});

const PUBLIC_COLUMNS = `
  id, username, full_name, role, permissions, profile_image, is_active,
  must_change_password, password_changed_at, last_login_at, created_at
`;

const countActiveAdmins = async (excludeUserId = null) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users WHERE role = $1 AND is_active = TRUE AND ($2::int IS NULL OR id <> $2)`,
    [ADMIN_ROLE, excludeUserId]
  );
  return result.rows[0].total;
};

const findUserById = async (id) => {
  const result = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

// List every account (admin only)
const listUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY is_active DESC, username ASC`
    );

    res.status(200).json({
      success: true,
      users: result.rows.map(toPublicUser)
    });
  } catch (err) {
    console.error('List users error:', err);
    handleDatabaseError(err, res, 'Failed to load users');
  }
};

// Create an account (admin only)
const createUser = async (req, res) => {
  try {
    const { username, password, fullName = '', role = 'staff', permissions = [] } = req.body;
    const normalisedRole = ROLES.includes(role) ? role : 'staff';

    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
        code: 'USERNAME_TAKEN'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const granted = sanitizePermissions(permissions);

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       RETURNING ${PUBLIC_COLUMNS}`,
      [username, hashedPassword, fullName.trim() || username, normalisedRole, JSON.stringify(granted)]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: toPublicUser(result.rows[0])
    });
  } catch (err) {
    console.error('Create user error:', err);
    handleDatabaseError(err, res, 'Failed to create user');
  }
};

// Update another account (admin only)
const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await findUserById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const { fullName, role, permissions, isActive } = req.body;

    const nextRole = ROLES.includes(role) ? role : existing.role;
    const nextActive = typeof isActive === 'boolean' ? isActive : existing.is_active;
    const nextName =
      typeof fullName === 'string' && fullName.trim() !== '' ? fullName.trim() : existing.full_name;

    // Granting admin restores full access, so drop any leftover permission list
    const nextPermissions =
      nextRole === ADMIN_ROLE ? [] : sanitizePermissions(
        Array.isArray(permissions) ? permissions : parsePermissions(existing.permissions)
      );

    const losesAdmin =
      existing.role === ADMIN_ROLE && (nextRole !== ADMIN_ROLE || nextActive === false);

    if (losesAdmin && (await countActiveAdmins(id)) === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one active administrator must remain',
        code: 'LAST_ADMIN'
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, role = $2, permissions = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING ${PUBLIC_COLUMNS}`,
      [nextName, nextRole, JSON.stringify(nextPermissions), nextActive, id]
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: toPublicUser(result.rows[0])
    });
  } catch (err) {
    console.error('Update user error:', err);
    handleDatabaseError(err, res, 'Failed to update user');
  }
};

// Set a temporary password for another account (admin only).
// The account is flagged so its owner must choose a new one at next sign in.
const resetUserPassword = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await findUserById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    const result = await pool.query(
      `UPDATE users
       SET password = $1, must_change_password = TRUE, password_changed_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING ${PUBLIC_COLUMNS}`,
      [hashedPassword, id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset. The user must change it at next sign in.',
      user: toPublicUser(result.rows[0])
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    handleDatabaseError(err, res, 'Failed to reset password');
  }
};

// Delete an account (admin only)
const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await findUserById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete the account you are signed in with',
        code: 'SELF_DELETE'
      });
    }

    if (existing.role === ADMIN_ROLE && (await countActiveAdmins(id)) === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one active administrator must remain',
        code: 'LAST_ADMIN'
      });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    handleDatabaseError(err, res, 'Failed to delete user');
  }
};

// Update the signed in user's own name and photo
const updateMyProfile = async (req, res) => {
  try {
    const { fullName = '', profileImage = null } = req.body;

    const nextName = fullName.trim() || req.user.username;
    const nextImage = typeof profileImage === 'string' && profileImage.startsWith('data:image/')
      ? profileImage
      : null;

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, profile_image = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING ${PUBLIC_COLUMNS}`,
      [nextName, nextImage, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: toPublicUser(result.rows[0])
    });
  } catch (err) {
    console.error('Update profile error:', err);
    handleDatabaseError(err, res, 'Failed to update profile');
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  updateMyProfile,
  toPublicUser,
  parsePermissions,
  ROLES
};