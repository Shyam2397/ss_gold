const express = require('express');
const router = express.Router();
const {
  getAllPureExchanges,
  createPureExchange,
  updatePureExchange,
  deletePureExchange
} = require('../controllers/pureExchangeController');
const { validatePureExchange } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');

router.get('/', async (req, res) => {
  try {
    await getAllPureExchanges(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch pure exchanges');
  }
});

router.post('/', validatePureExchange, async (req, res) => {
  try {
    await createPureExchange(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create pure exchange');
  }
});

router.put('/:tokenNo', validatePureExchange, async (req, res) => {
  try {
    await updatePureExchange(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update pure exchange');
  }
});

router.delete('/:tokenNo', async (req, res) => {
  try {
    await deletePureExchange(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete pure exchange');
  }
});

module.exports = router;
