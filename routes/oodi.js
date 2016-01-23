/**
 * Created by omantere on 21.1.2016.
 */
var express = require('express');
var router = express.Router();

var api = require('./oodi/api');
router.use('/api', api)

module.exports = router;