/**
 * Created by omantere on 21.1.2016.
 */
var express = require('express');
var router = express.Router();

var api = require('./oodi/api');
router.use('/api', api)

/* GET frontend/app. */
router.get('/', function(req, res, next) {
    res.render('oodi-frontend', { title: 'Aalto WebOodi Calendar Tool' });
});


module.exports = router;