/**
 * Created by omantere on 25.6.2016.
 */
var express = require('express');
var router = express.Router();
var axios = require('axios');

var environment = process.env;

const user = environment.HSL_USER;
const pass = environment.HSL_PASS;

/* GET bus data */
router.get('/meno', function(req, res, next) {

    var resp = {};

    axios.get('http://api.reittiopas.fi/hsl/prod/?user='+user+'&pass='+pass+'&request=stop&code=1310198')
        .then((response) => {
            resp = response.data;
            res.json(resp);
        }).catch(err => {
            res.json({err: err})
    });
});

router.get('/tulo', function(req, res, next) {

    var resp = {};

    axios.get('http://api.reittiopas.fi/hsl/prod/?user='+user+'&pass='+pass+'&request=stop&code=1310299')
        .then((response) => {
            resp = response.data;
            res.json(resp);
        }).catch(err => {
            res.json({err: err})
    });
});

module.exports = router;