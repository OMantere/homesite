/**
 * Created by omantere on 23.1.2016.
 */
var express = require('express');
var router = express.Router();
var scraper = require('./../../scrape-oodi');
var bodyParser = require('body-parser');
var maxTries = 1; // Maximum tries scraping

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));


var doScrape = function (user, pass) {
    var tries = 0;
    return scrape(user, pass, tries);
}

var scrape = function (user, pass, tries) {
    tries++;
    return new Promise(function(resolve, reject) {
        scraper.scrape(user, pass).then(function (result) {
            if(result.indexOf('No data found, error data:') == 0 && tries < maxTries)
                scrape(user, pass, tries);
            else
                resolve(result);
        })
    })
}


/* POST a scrape. */
router.post('/scrape', function(req, res) {
    var user = req.body.user;
    var pass = req.body.pass;
    doScrape(user, pass, 0).then(function (result) {
        if(result.indexOf('No data found, error data:') == 0) {
            var errMsg = result.slice(result.indexOf('\n')+1);
            res.send({status:1, errMsg: errMsg});
        } else {
            res.send({status:0, data: result});
        }
    })
});

module.exports = router;