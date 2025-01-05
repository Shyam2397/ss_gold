const express = require('express');
const router = express.Router();
const {
  getAllPureExchanges,
  createPureExchange,
  updatePureExchange,
  deletePureExchange
} = require('../controllers/pureExchangeController');

router.get('/', getAllPureExchanges);
router.post('/', createPureExchange);
router.put('/:tokenNo', updatePureExchange);
router.delete('/:tokenNo', deletePureExchange);

module.exports = router;
