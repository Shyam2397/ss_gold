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
const { validateToken } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { authenticate, requireMenuAccess } = require('../middleware/auth');

router.use(authenticate);

// Tokens are read by the Token and Token Data menus, by Skin Testing (to label a
// certificate), by Unpaid Customers and by the Cash Book, so any of those grants
// a read. Only the Token menu may create, edit or delete one.
router.use(requireMenuAccess({
  read: ['token', 'token-data', 'skin-testing', 'skintest-data', 'unpaid-customers', 'cashbook', 'dashboard'],
  write: ['token']
}));

router.get('/', async (req, res) => {
  try {
    await getAllTokens(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch tokens');
  }
});

router.get('/generate', async (req, res) => {
  try {
    await generateTokenNumber(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to generate token number');
  }
});

router.get('/:tokenNo', async (req, res) => {
  try {
    await getTokenByNumber(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch token');
  }
});

router.post('/', validateToken, async (req, res) => {
  try {
    await createToken(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create token');
  }
});

router.put('/:id', validateToken, async (req, res) => {
  try {
    await updateToken(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update token');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteToken(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete token');
  }
});

router.patch('/:id/payment', async (req, res) => {
  try {
    await updatePaymentStatus(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update payment status');
  }
});

module.exports = router;
