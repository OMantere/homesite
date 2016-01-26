/**
 * Created by oskari on 26.1.2016.
 */

var existingEvents = [];
var now;
var googleDate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):(\d{2})$/;
var addresses;



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
    console.log(event);
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





var scrapeReq = function (dataObj) {

    $('#getcourses-button').hide();
    $('#getcourses-loader').show();
    $('#loading-weboodi').show();

    return new Promise(function(resolve, reject) {

        var callback = function (result, status, xhr) {
            if(result.status != 0) {
                $('.loaders').children().hide();
                $('#getcourses-button').show();
                alert('WebOodi login failed. Please double-check your credentials and try again.');
            } else {
                resolve({data: JSON.parse(result.data), status: result.status});
            }
        };



        $.ajax({
            type: "POST",
            url: "/oodi/api/scrape",
            data: JSON.stringify(dataObj),
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            success: callback
        });
    })
}




function listUpcomingEvents() {

    now = (new Date()).toISOString();

    var request = gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'showDeleted': false,
        'singleEvents': false,
        'maxResults': 2500
    });

    request.execute(function(resp) {
        var events = resp.items;
        console.log(resp);

        if (events.length > 0) {
            existingEvents = events;
        }
    });
}




function scrollToBottom() {
    $("html, body").animate({ scrollTop: $(document).height() }, "slow");
}


function allDone() {
    $('.thankyou').show();
    $('#loading-alldone').show();
    $('#getcourses-loader').hide();
    scrollToBottom();
}




var scrapeAndPushToCalendar = function () {
    if (gData.googleAuthed && now != null) {

        var aaltoForm = document.getElementById("aalto-login");

        if (!aaltoForm.elements[0].value || !aaltoForm.elements[1].value) {
            alert('Please fill in your credentials');
            return;
        }

        var dataObj = {user: aaltoForm.elements[0].value, pass: aaltoForm.elements[1].value};

        scrollToBottom();

        scrapeReq(dataObj).then(function (result) {

            if (result.status == 0) {

                var data = result.data;

                console.log(data);

                $('#loading-calendar').show();
                scrollToBottom();

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
                                                            console.log('Event ' + oodiHash(event));
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
                    existingEvents.forEach(function (ev) {
                        console.log(oodiHash(event));
                    })
                } else {
                    alert('No courses found');
                }

                console.log(eventPool.length + ' events total');

                var sent = 0, received = 0;

                if (eventPool.length > 0) {

                    var refreshInterval = setInterval(function () {
                        sent++;
                        if(sent < eventPool.length) {
                            gapi.client.calendar.events.insert({
                                'calendarId': 'primary',
                                'resource': eventPool[sent]
                            }).execute(function () {
                                received++;
                                if (received == eventPool.length) {
                                    clearInterval(refreshInterval);
                                    allDone(); // :)
                                }
                            });
                        }

                    }, 150)

                } else {
                    allDone(); // :)
                    alert('Your calendar is already up to date. No events were sent.');
                }
            }
        })
    } else {
        alert('Please sign in with Google first');
    }
}


function handleAaltoLogin(event) {
    scrapeAndPushToCalendar();
}


// Get us some campus addresses!

$.ajax({
    type: "GET",
    url: "/assets/osoitteet.json",
    contentType: "application/json; charset=utf-8",
    dataType: 'json',
    success: function (data) {
        addresses = data;
    }
});


checkCalendarApiLoaded(listUpcomingEvents);





