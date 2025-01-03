const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expensesController');

// Create a new expense
router.post('/', createExpense);

// Get all expenses
router.get('/', getAllExpenses);

// Get expense by ID
router.get('/:id', getExpenseById);

// Update an expense
router.put('/:id', updateExpense);

// Delete an expense
router.delete('/:id', deleteExpense);

module.exports = router;
