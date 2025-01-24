const express = require('express');
const router = express.Router();
const {
  getAllEntries,
  getEntryByCode,
  createEntry,
  updateEntry,
  deleteEntry
} = require('../controllers/entriesController');
const { validateEntry } = require('../middleware/validation');
const { handleDatabaseError } = require('../middleware/errorHandler');

router.get('/', async (req, res) => {
  try {
    await getAllEntries(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch entries');
  }
});

router.get('/:code', async (req, res) => {
  try {
    await getEntryByCode(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to fetch entry');
  }
});

router.post('/', validateEntry, async (req, res) => {
  try {
    await createEntry(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to create entry');
  }
});

router.put('/:id', validateEntry, async (req, res) => {
  try {
    await updateEntry(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to update entry');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteEntry(req, res);
  } catch (err) {
    handleDatabaseError(err, res, 'Failed to delete entry');
  }
});

module.exports = router;
