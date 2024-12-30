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

router.get('/', getAllSkinTests);
router.get('/phone_number/:code', getPhoneNumberByCode);
router.post('/', createSkinTest);
router.post('/reset', resetSkinTests);
router.put('/:tokenNo', updateSkinTest);
router.delete('/:tokenNo', deleteSkinTest);

module.exports = router;
