const express = require('express');
const router = express.Router();
const {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  deleteToken,
  generateTokenNumber
} = require('../controllers/tokensController');

router.get('/', getAllTokens);
router.get('/generate', generateTokenNumber);
router.get('/:tokenNo', getTokenByNumber);
router.post('/', createToken);
router.put('/:id', updateToken);
router.delete('/:id', deleteToken);

module.exports = router;
