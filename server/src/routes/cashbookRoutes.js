const express = require('express');
const router = express.Router();
const { getOpeningBalance, getMonthlySummary } = require('../controllers/cashbookController');
const { authenticate, requireMenuAccess } = require('../middleware/auth');

router.use(authenticate);

router.use(requireMenuAccess({
  read: ['cashbook'],
  write: []
}));

router.get('/opening-balance', getOpeningBalance);
router.get('/monthly-summary', getMonthlySummary);

module.exports = router;
