const express = require('express');
const router = express.Router();
const {
  getAllEntries,
  getEntryByCode,
  createEntry,
  updateEntry,
  deleteEntry
} = require('../controllers/entriesController');

router.get('/', getAllEntries);
router.get('/:code', getEntryByCode);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
