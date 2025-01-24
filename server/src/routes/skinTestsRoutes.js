const express = require('express');
const router = express.Router();
const {
  getAllSkinTests,
  createSkinTest,
  updateSkinTest,
  deleteSkinTest,
  getPhoneNumberByCode,
  resetSkinTests
} = require('../controllers/skinTestsController');
const { validateSkinTest } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');

router.get('/', async (req, res) => {
  try {
    await getAllSkinTests(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch skin tests');
  }
});

router.get('/phone_number/:code', async (req, res) => {
  try {
    await getPhoneNumberByCode(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch phone number');
  }
});

router.post('/', validateSkinTest, async (req, res) => {
  try {
    await createSkinTest(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create skin test');
  }
});

router.post('/reset', async (req, res) => {
  try {
    await resetSkinTests(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to reset skin tests');
  }
});

router.put('/:tokenNo', validateSkinTest, async (req, res) => {
  try {
    await updateSkinTest(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update skin test');
  }
});

router.delete('/:tokenNo', async (req, res) => {
  try {
    await deleteSkinTest(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete skin test');
  }
});

module.exports = router;
