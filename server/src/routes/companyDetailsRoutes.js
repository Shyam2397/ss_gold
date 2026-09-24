const express = require('express');
const router = express.Router();
const {
  getCompanyDetails,
  saveCompanyDetails
} = require('../controllers/companyDetailsController');

router.get('/', async (req, res) => {
  try {
    await getCompanyDetails(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

router.put('/', async (req, res) => {
  try {
    await saveCompanyDetails(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save company details' });
  }
});

module.exports = router;