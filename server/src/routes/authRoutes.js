const express = require('express');
const router = express.Router();
const { login, createUser, getProfile, changePassword } = require('../controllers/authController');
const { checkDatabaseConnection, listUsers } = require('../utils/dbUtils');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { validateLogin, validateChangePassword } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Login route
router.post('/login', validateLogin, async (req, res) => {
  try {
    await login(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Login failed');
  }
});

// Create user route (for development/testing)
router.post('/register', validateLogin, async (req, res) => {
  try {
    await createUser(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'User registration failed');
  }
});

// Details of the currently logged in user
router.get('/me', authenticate, async (req, res) => {
  try {
    await getProfile(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to load account details');
  }
});

// Update the password of the currently logged in user
router.post('/change-password', authenticate, validateChangePassword, async (req, res) => {
  try {
    await changePassword(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update password');
  }
});

// Debug routes (only available in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/connection', async (req, res) => {
    try {
      const hasUsersTable = await checkDatabaseConnection();
      const users = await listUsers();
      
      res.json({
        databaseStatus: 'connected',
        dbType: 'PostgreSQL',
        hasUsersTable,
        userCount: users.length,
        users
      });
    } catch (err) {
      handleDatabaseError(err, res, 'Database connection check failed');
    }
  });
}

module.exports = router;
