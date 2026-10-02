const express = require('express');
const router = express.Router();
const {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  updateMyProfile,
} = require('../controllers/userController');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  validateProfile,
} = require('../middleware/validation');

// Everything below requires a valid session
router.use(authenticate);

// The signed in user's own profile (name + photo) is available to every role
router.put('/me', validateProfile, async (req, res) => {
  try {
    await updateMyProfile(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update profile');
  }
});

// Account management is restricted to administrators
router.get('/', requireAdmin, async (req, res) => {
  try {
    await listUsers(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to load users');
  }
});

router.post('/', requireAdmin, validateCreateUser, async (req, res) => {
  try {
    await createUser(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'User creation failed');
  }
});

router.put('/:id', requireAdmin, validateUpdateUser, async (req, res) => {
  try {
    await updateUser(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update user');
  }
});

router.put('/:id/password', requireAdmin, validateResetPassword, async (req, res) => {
  try {
    await resetUserPassword(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to reset password');
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await deleteUser(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete user');
  }
});

module.exports = router;