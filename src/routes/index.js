var express = require('express');
var router = express.Router();

const contents = require('./contents')

/* contents router */
router.use('/contents', contents)

module.exports = router;
