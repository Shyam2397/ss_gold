const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { checkDatabaseConnection, listUsers } = require('../utils/dbUtils');

router.post('/login', login);

// Debug routes
router.get('/debug/connection', async (req, res) => {
  try {
    const hasUsersTable = await checkDatabaseConnection();
    const users = await listUsers();
    res.json({
      databaseStatus: 'connected',
      hasUsersTable,
      userCount: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({
      databaseStatus: 'error',
      error: err.message
    });
  }
});

module.exports = router;
