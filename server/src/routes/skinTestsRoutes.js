const express = require('express');
const skinTestsController = require('../controllers/skinTestsController');

const router = express.Router();

router.post('/', skinTestsController.createSkinTest);

module.exports = router;
