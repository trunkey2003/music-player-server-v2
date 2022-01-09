const express = require('express');
const router = express.Router();

const siteController = require('../controllers/site.controller');



/* GET home page. */

router.get('/', siteController.show);

module.exports = router;
