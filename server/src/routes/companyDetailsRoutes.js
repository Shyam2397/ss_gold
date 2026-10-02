const express = require('express');
const router = express.Router();
const {
  getCompanyDetails,
  saveCompanyDetails
} = require('../controllers/companyDetailsController');
const { authenticate, requireMenuAccess } = require('../middleware/auth');
const { validateCompanyDetails } = require('../middleware/validation');

// Stays readable without a session: CompanyDetailsProvider sits above the login
// screen (client/src/App.jsx) and the sign-in header shows this branding
router.get('/', async (req, res) => {
  try {
    await getCompanyDetails(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// Only the Settings menu may rewrite what appears on printed certificates
router.put(
  '/',
  authenticate,
  requireMenuAccess({ write: ['settings'] }),
  validateCompanyDetails,
  async (req, res) => {
    try {
      await saveCompanyDetails(req, res);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save company details' });
    }
  }
);

module.exports = router;