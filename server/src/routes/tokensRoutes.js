const express = require('express');
const tokensController = require('../controllers/tokensController');

const router = express.Router();

router.post('/', tokensController.createToken);

module.exports = router;
