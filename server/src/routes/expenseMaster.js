const express = require('express');
const router = express.Router();
const {
  createExpenseType,
  getAllExpenseTypes,
  updateExpenseType,
  deleteExpenseType
} = require('../controllers/expenseMasterController');

// Create a new expense type
router.post('/', createExpenseType);

// Get all expense types
router.get('/', getAllExpenseTypes);

// Update an expense type
router.put('/:id', updateExpenseType);

// Delete an expense type
router.delete('/:id', deleteExpenseType);

module.exports = router;
