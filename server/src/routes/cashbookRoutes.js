const express = require('express');
const router = express.Router();
const { getOpeningBalance, getMonthlySummary } = require('../controllers/cashbookController');

router.get('/opening-balance', getOpeningBalance);
router.get('/monthly-summary', getMonthlySummary);

module.exports = router;
