const express = require('express');
const router = express.Router();
const { login, createUser } = require('../controllers/authController');
const { checkDatabaseConnection, listUsers } = require('../utils/dbUtils');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { validateLogin } = require('../middleware/validation');

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
