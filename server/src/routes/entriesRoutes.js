const express = require('express');
const entriesController = require('../controllers/entriesController');

const router = express.Router();

router.get('/', entriesController.getEntry);
router.post('/', entriesController.createEntry);

module.exports = router;
