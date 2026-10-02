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
const { authenticate, requireMenuAccess } = require('../middleware/auth');

router.use(authenticate);

const access = requireMenuAccess({
  read: ['cashbook', 'cash-adjustments'],
  write: ['cash-adjustments']
});

router.post('/', access, createCashAdjustment);
router.get('/', access, getCashAdjustments);
router.get('/summary', access, getCashAdjustmentSummary);
router.get('/:id', access, getCashAdjustmentById);
router.put('/:id', access, updateCashAdjustment);
router.delete('/:id', access, deleteCashAdjustment);

module.exports = router;
