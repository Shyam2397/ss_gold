const express = require('express');
const router = express.Router();
const { getOpeningBalance } = require('../controllers/cashbookController');

router.get('/opening-balance', getOpeningBalance);

module.exports = router;
