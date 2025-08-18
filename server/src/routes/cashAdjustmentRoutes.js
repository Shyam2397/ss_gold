const express = require('express');
const router = express.Router();
const {
  createCashAdjustment,
  getCashAdjustments,
  getCashAdjustmentById,
  updateCashAdjustment,
  deleteCashAdjustment,
  getCashAdjustmentSummary
} = require('../controllers/cashAdjustmentController');

// Create a new cash adjustment
router.post('/', createCashAdjustment);

// Get all cash adjustments (with optional date range query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
router.get('/', getCashAdjustments);

// Get cash adjustment summary by date range (requires both startDate and endDate query params)
router.get('/summary', getCashAdjustmentSummary);

// Get a single cash adjustment by ID
router.get('/:id', getCashAdjustmentById);

// Update a cash adjustment
router.put('/:id', updateCashAdjustment);

// Delete a cash adjustment
router.delete('/:id', deleteCashAdjustment);

module.exports = router;
