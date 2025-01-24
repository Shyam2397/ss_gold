const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expensesController');
const { validateExpense } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');

// Create a new expense
router.post('/', validateExpense, async (req, res) => {
  try {
    await createExpense(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create expense');
  }
});

// Get all expenses
router.get('/', async (req, res) => {
  try {
    await getAllExpenses(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch expenses');
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    await getExpenseById(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch expense');
  }
});

// Update an expense
router.put('/:id', validateExpense, async (req, res) => {
  try {
    await updateExpense(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update expense');
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    await deleteExpense(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete expense');
  }
});

module.exports = router;
