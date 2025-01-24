const express = require('express');
const router = express.Router();
const {
  createExpenseType,
  getAllExpenseTypes,
  updateExpenseType,
  deleteExpenseType
} = require('../controllers/expenseMasterController');
const { validateExpenseType } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');

// Create a new expense type
router.post('/', validateExpenseType, async (req, res) => {
  try {
    await createExpenseType(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create expense type');
  }
});

// Get all expense types
router.get('/', async (req, res) => {
  try {
    await getAllExpenseTypes(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch expense types');
  }
});

// Update an expense type
router.put('/:id', validateExpenseType, async (req, res) => {
  try {
    await updateExpenseType(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update expense type');
  }
});

// Delete an expense type
router.delete('/:id', async (req, res) => {
  try {
    await deleteExpenseType(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete expense type');
  }
});

module.exports = router;
