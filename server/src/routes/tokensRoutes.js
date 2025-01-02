const express = require('express');
const router = express.Router();
const {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  deleteToken,
  generateTokenNumber,
  updatePaymentStatus
} = require('../controllers/tokensController');

router.get('/', getAllTokens);
router.get('/generate', generateTokenNumber);
router.get('/:tokenNo', getTokenByNumber);
router.post('/', createToken);
router.put('/:id', updateToken);
router.delete('/:id', deleteToken);
router.patch('/:id/payment', updatePaymentStatus);

module.exports = router;
