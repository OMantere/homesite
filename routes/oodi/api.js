/**
 * Created by omantere on 23.1.2016.
 */
var express = require('express');
var router = express.Router();
var scraper = require('./../../scrape-oodi');
var bodyParser = require('body-parser');
var maxTries = 1; // Maximum tries scraping
var https = require('https');
var environment = process.env.NODE_ENV;

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;


if(environment == 'production') {
    var CLIENT_ID = '1006558970051-1uu83be36jp92ra3eese7597k9l371d1.apps.googleusercontent.com';
    var CLIENT_SECRET = process.env.GOOGLE_API_CLIENT_SECRET;
} else {
    var CLIENT_ID = '1006558970051-h7ufs8mmtqgt5eu4pcklfjivsfh2lor7.apps.googleusercontent.com';
    var CLIENT_SECRET = 'x3lxtghAsFVOnL1q_F5jV0e2';
}

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, '');
var calendar = google.calendar({version: 'v3', auth: oauth2Client });



router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));


var googleDate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):(\d{2})$/;
var addresses = {
    "R001": "Otakaari 1",
    "R002": "Rakentajanaukio 4",
    "R003": "Otakaari 3",
    "R004": "Otakaari 5",
    "R005": "Sähkömiehentie 4",
    "R006": "Puumiehemkuja 5",
    "R007": "Puumiehenkuja 3",
    "R008": "Otakaari 4",
    "R009": "Puumiehenkuja 2",
    "R010": "Konemiehentie 4",
    "R011": "Kemistintie 1",
    "R012": "Vuorimiehentie 2",
    "R013": "Vuorimiehentie 1",
    "R014": "Tekniikantie 3",
    "R015": "Otaniementie 9",
    "R016": "Tietotie 1 A",
    "R017": "Sähkömiehentie 3",
    "R019": "Otakaari 24",
    "R022": "Lämpömiehenkuja 2",
    "R023": "Lämpömiehenkuja 3",
    "R024": "Miestentie 3",
    "R025": "Betonimiehenkuja 5",
    "R026": "Betonimiehenkuja 3",
    "R027": "Metallimiehenkuja 4",
    "R029": "Otakaari 7",
    "R030": "Konemiehentie 2",
    "R032": "Otaniementie 19",
    "R034": "Tietotie 1 E",
    "R035": "Vaisalantie 8",
    "R036": "Tietotie 3",
    "R037": "Otaniementie 17",
    "R101": "Runeberginkatu 14",
    "R103": "Runeberginkatu 22",
    "R102": "Arkadiankatu 24",
    "R108": "Arkadiankatu 28",
    "R104": "Arkadiankatu 7",
    "R1O7": "Mechelininkatu 3 D",
    "R1O9": "Energiakuja 3",
    "R201": "Hämeentie 135 C"
};



String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length === 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

var oodiHash = function(event) {
    if(event.extendedProperties == undefined || event.extendedProperties.private == undefined) {
        return 0;
    } else  {
        if (event.extendedProperties.private.oodiId == null) {
            var hash = (event.start.dateTime || '' + event.end.dateTime || '' + event.summary || '' + event.location || '').hashCode();
            event.extendedProperties.private.oodiId = hash;
            return hash

        } else
            return event.extendedProperties.private.oodiId;
    }
};



function parseGoogleDate(d) {
    var m = googleDate.exec(d);
    var year   = +m[1];
    var month  = +m[2];
    var day    = +m[3];
    var hour   = +m[4];
    var minute = +m[5];
    var second = +m[6];
    var tzHour = +m[7];
    var tzMin  = +m[8];
    var tzOffset = new Date().getTimezoneOffset() + tzHour * 60 + tzMin;

    return new Date(year, month - 1, day, hour, minute - tzOffset, second, 0);
}




var setGoogleAuthCredentials = function (token) {
    oauth2Client.setCredentials({
        access_token: token
    });
}


var listUpcomingEvents = function() {
    return new Promise(function (resolve, reject) {
        calendar.events.list({
            'calendarId': 'primary',
            'showDeleted': false,
            'singleEvents': false,
            'maxResults': 2500
        }, function(err, resp) {
            resolve(resp.items);
        });
    })
}






var pushToCalendar = function (data, existingEvents) {

    return new Promise(function (resolve, reject) {

        var eventPool = [];

        if (data.length > 0) {
            data.forEach(function (course) {

                if (course.activities.length > 0) {
                    course.activities.forEach(function (activity) {

                        if (activity.timeSpans.length > 0) {
                            activity.timeSpans.forEach(function (timeSpan) {

                                var startYear = '20' + timeSpan.timeSpan.slice(-2);
                                var startDate = startYear + '-' + timeSpan.timeSpan.slice(3, 5) + '-' + timeSpan.timeSpan.slice(0, 2);

                                var recurring = false;
                                if (timeSpan.timeSpan.indexOf('-') > -1)
                                    recurring = true;

                                if (recurring)
                                    var endDate = startYear + '-' + timeSpan.timeSpan.slice(10, 12) + '-' + timeSpan.timeSpan.slice(7, 9);
                                else
                                    var endDate = startDate;


                                if (timeSpan.days.length > 0) {
                                    timeSpan.days.forEach(function (day) {

                                        var startTime = startDate + 'T' + day.duration.slice(0, 5).replace(/\./g, ':') + ':00+02:00';
                                        var endTime = startDate + 'T' + day.duration.slice(6, 11).replace(/\./g, ':') + ':00+02:00';
                                        var lastEventEndTime = endDate + 'T' + day.duration.slice(6, 11).replace(/\./g, ':') + ':00+02:00';

                                        if (parseGoogleDate(lastEventEndTime) > Date.now()) {

                                            if (recurring)
                                                var recurrence = ["RRULE:FREQ=WEEKLY;UNTIL=" + endDate.replace(/-/g, '') + 'T230000Z'];
                                            else
                                                var recurrence = [];

                                            day.streetLocation = addresses[day.location.slice(0, 4)];

                                            var event = {
                                                'summary': course.name + '- ' + activity.name + (day.location.length > 5 ? ', class ' + day.location.slice(5) : ''),
                                                'location': day.streetLocation,
                                                'description': '',
                                                'start': {
                                                    'dateTime': startTime,
                                                    'timeZone': 'Europe/Helsinki'
                                                },
                                                'end': {
                                                    'dateTime': endTime,
                                                    'timeZone': 'Europe/Helsinki'
                                                },
                                                'recurrence': recurrence,
                                                'reminders': {
                                                    'useDefault': true
                                                },
                                                'extendedProperties': {
                                                    'private': {oodiId: null}
                                                }
                                            };

                                            oodiHash(event);


                                            if (existingEvents.length > 0) {
                                                if (!existingEvents.some(function (existingEvent) {
                                                        if (oodiHash(existingEvent) == oodiHash(event)) {
                                                            return true;
                                                        }
                                                    })) {
                                                    eventPool.push(event);
                                                }
                                            } else {
                                                eventPool.push(event);
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        } else {
            resolve(2);
        }

        var sent = 0, received = 0;

        if (eventPool.length > 0) {
            var refreshInterval = setInterval(function () {

                if (sent < eventPool.length) {

                    calendar.events.insert({
                        'calendarId': 'primary',
                        'resource': eventPool[sent]
                    }, function () {
                        received++;
                        if (received == eventPool.length) {
                            clearInterval(refreshInterval);
                            resolve(0);
                        }
                    });
                }

                sent++;

            }, 150)
        } else {
            resolve(1);
        }
    })
}







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









/* GET a calendar push. */
router.get('/push-calendar', function(req, res) {
    pushToCalendar(JSON.parse(req.session.courseData), JSON.parse(req.session.existingEvents)).then(function (status, existingEvents) {
        delete req.session;
        res.send({status: status});
    })
});



/* POST a scrape. */
router.post('/scrape', function(req, res) {
    var user = req.body.user;
    var pass = req.body.pass;

    setGoogleAuthCredentials(req.body.token);

    listUpcomingEvents().then(function (existingEvents) {
        req.session.existingEvents = JSON.stringify(existingEvents);
    });

    doScrape(user, pass, 0).then(function (result) {
        if(result.indexOf('No data found, error data:') == 0) {
            var errMsg = result.slice(result.indexOf('\n')+1);
            res.send({status:1, errMsg: errMsg});
        } else {
            req.session.courseData = result;
            res.send({status: 0});
        }
    })
});

module.exports = router;