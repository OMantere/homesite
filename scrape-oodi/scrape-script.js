/**
 * Created by omantere on 21.1.2016.
 */



var checkLoginFailure = function (state, page) {
    state.loginCheckInProgress = true;
    page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function () {
        if(page.evaluate(function (state) {
            return ($('p.form-element.form-error').text().indexOf('Login has failed') > -1);
        })) {
            console.log('Check login credentials');
            phantom.exit(1);
        } else {
            state.loginCheckInProgress = false;
        }
    })
}





var updateState = function (state) {
    state.step++;
    state.stepDone = false;
    state.waitForRedirect = false;
    state.previousUrl = "";
    console.log("step " + (state.step + 1));
};

// Main powerhouse, execution function to go through the steps

var doSteps = function (steps, page, state, description, callback) {

    // stepDone: if false, previous step is still pending so dont execute next step yet
    state.step = -1;
    state.loadInProgress = false;
    state.stepDone = true;
    state.loginCheckInProgress = false

    console.log("New step sequence: " + description);

    // Event handlers
    page.onConsoleMessage = function(msg, lineNum, sourceId) {
        console.log('CONSOLE: ' + msg);
    };

    page.onError = function (msg, trace) {
        console.log(msg);
        trace.forEach(function(item) {
            console.log('  ', item.file, ':', item.line);
        });
        phantom.exit(1);
    };

    page.onLoadStarted = function () {
        state.loadInProgress = true;
        console.log("load started");
    };

    page.onLoadFinished = function () {
        state.loadInProgress = false;
        console.log("load finished");
    };

    // Do the steps!
    var refreshIntervalId = setInterval(function () {

        // We don't want to proceed if the redirect hasn't occurred yet
        if(state.waitForRedirect) {
            if (page.frameUrl == state.previousUrl) {
                if (!state.loadInProgress) {
                    checkLoginFailure(state, page);
                }
                return;
            }
        }

        if(!state.loadInProgress && state.stepDone) {
            if (typeof steps[state.step + 1] != "function") {
                console.log("Step sequence '" + description + "' complete!");
                clearInterval(refreshIntervalId);
                callback(state);
            }
            else if(typeof steps[state.step + 1] == "function") {
                updateState(state);
                steps[state.step](state, page);
            }
        }
    }, 50);
}



// Define datastructure for course data
var coursesData = [];

// Define the steps
var steps1 = [

    // Open the WebOodi page which will redirect to login page
    function (state, page) {
        page.open('https://oodi.aalto.fi/a/oodishibboleth_student.jsp', function (status) {
            console.log("Opened login page", status);
            state.stepDone = true;
        })
    },

    // Login using given credentials
    function (state, page) {
        state.waitForRedirect = true;
        state.previousUrl = page.frameUrl;
        console.log(page.frameUrl);
        if (state.step == 1 && !state.loginCheckInProgress) {
            page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function () {

                page.evaluate(function (state) {
                    if (state.step == 1 && !state.loginCheckInProgress) {
                        var formElements = $('#login');
                        formElements.find('#username').first().val(state.user);
                        formElements.find('#password').first().val(state.pass);
                        formElements.find('.form-button').first().click();
                        console.log("Submitted login form");
                    }
                }, state)

                state.stepDone = true;
            })
        }
    },
    // Pick up session key and go to enrollments
    function (state, page) {
        console.log(page.frameUrl);
        page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function () {
            if (state.step == 2) {
                var menuUrl = page.evaluate(function (state) {
                    if (state.step == 2) {
                        return $('frame[name="valikko"]').attr('src');
                    }
                }, state);
                state.MD5key = menuUrl.substring(menuUrl.indexOf('MD5avain=') + 9, menuUrl.indexOf('MD5avain=') + 9 + 32);
                page.open('https://oodi.aalto.fi/a/omatopinn.jsp?Kieli=1&MD5avain=' + state.MD5key + '&NaytIlm=1', function (status) {
                    console.log("Navigated to enrollments", status);
                    state.stepDone = true;
                })
            }
        })
    },
    // Count the courses
    function (state, page) {
        console.log(page.frameUrl);
        page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function () {
            if (state.step == 3) {
                state.courses = page.evaluate(function (state) {
                    if (state.step == 3) {

                        var courseCells = $('table[border="0"][width="100%"].eisei').children('tbody').children('tr').slice(1);
                        coursesData = [];
                        courseCells.each(function (index) {
                            coursesData.push({
                                name: $(this).children('td:nth-child(2)').text(),
                                linkUrl: $(this).children('td:nth-child(2)').children('a').attr('href')
                            });
                            console.log('Name: ' + $(this).children('td:nth-child(2)').text() + '\nUrl: ' + $(this).children('td:nth-child(2)').children('a').attr('href'));
                        });
                        console.log(coursesData.length + ' courses found');
                        return coursesData;
                    }
                }, state)
                state.stepDone = true;
            }
        })
    }
];


var scrapeSteps = [
    //Scrape data
    function (state, page) {
        page.open('https://oodi.aalto.fi' + state.courses[state.courseScrapeIndex].linkUrl, function (status) {
            delete state.courses[state.courseScrapeIndex].linkUrl; // Not needed any longer, just cluttering up the data
            state.scrapeDone = false; // To prevent scrape executing multiple times, caused by strange behavior of injectJs and evaluate
            page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function () {
                if(!state.scrapeDone) {
                    state.scrapeDone = true;

                    state.courses = page.evaluate(function (state) {
                        if (state.step == 0) {
                            console.log('Scraping course ' + state.courses[state.courseScrapeIndex].name);

                            // The tbody elements, 0 = exgroups 1 = lectures 2 = exams
                            var DOMtables = $('table.kll').children('tbody');
                            console.log(DOMtables.length + ' tables to scan');
                            console.log('First table has ' + DOMtables.first().children().slice(1).length + ' groups rows');
                            console.log('First row has ' + DOMtables.first().children().slice(0, 1).children().length + ' cells, selecting 2nd one');


                            // Add new day or add location to existing one
                            var addDay = function (newDay, array) {
                                if (array.length == 0) {
                                    array.push(newDay);
                                    console.log('Added new day "' + newDay.weekDay + '" ' + newDay.duration + '@' + newDay.location);
                                    return;
                                }
                                array.forEach(function (existingDay) {
                                    if (existingDay.duration == newDay.duration && existingDay.weekDay == newDay.weekDay) {
                                        existingDay.location += ', ' + newDay.location;
                                        console.log('Added location ' + newDay.location + ' to day ' + existingDay.weekDay + ' ' + existingDay.duration);
                                    }
                                    else {
                                        array.push(newDay);
                                        console.log('Added new day "' + newDay.weekDay + '" with duration ' + newDay.duration + '@' + newDay.location);
                                    }
                                })
                            }


                            // Data field of course object to store data into, type a numeric id
                            var scrape = function (activityIndex, state) {
                                console.log('Executing scrape on table ' + activityIndex);
                                console.log(DOMtables.slice(activityIndex, activityIndex + 1).children().length + ' rows');
                                DOMtables.slice(activityIndex, activityIndex + 1).children().each(function (rowIndex) {
                                    var dataCell = $(this).children('td:nth-child(2)');

                                    if (dataCell.length > 0 && (dataCell.hasClass('OK_OT'))) {
                                        console.log('Scraping row ' + rowIndex);
                                        var subCells = dataCell.find('table > tbody > tr > td');

                                        state.courses[state.courseScrapeIndex].activities[activityIndex].name = subCells.slice(0, 1).text().replace(/\s+/g, '');
                                        console.log('Name: ' + state.courses[state.courseScrapeIndex].activities[activityIndex].name);

                                        var timeSpanCells = subCells.find('table > tbody > tr > td');

                                        console.log('Event has ' + timeSpanCells.length + ' timespans, lets scrape their data');

                                        timeSpanCells.each(function (spanIndex) {
                                            var timeSpanCell = $(this);
                                            var words = timeSpanCell.text().replace(/\s+/g, ' ').split(' ').slice(0, -1);
                                            console.log('Words: ' + words.length + '  ' + words.toString());

                                            var timeSpan = {timeSpan: words.splice(0, 1)[0], days: []};
                                            console.log('Added timespan ' + timeSpan.timeSpan);
                                            var day = {};
                                            words.forEach(function (word, index, arr) {
                                                if (index % 2 == 0) {
                                                    //Start new day
                                                    console.log('New day "' + word + '"' + '@' + timeSpanCell.children('.submit2').slice(index / 2, (index / 2) + 1).val());
                                                    day = {
                                                        weekDay: word,
                                                        location: timeSpanCell.children('.submit2').slice(index / 2, (index / 2) + 1).val()
                                                    };
                                                } else {
                                                    day.duration = word;
                                                    //Save day
                                                    addDay(day, timeSpan.days);
                                                }
                                            })
                                            state.courses[state.courseScrapeIndex].activities[activityIndex].timeSpans.push(timeSpan);
                                        });
                                    }
                                })
                            }

                            state.courses[state.courseScrapeIndex].activities = [];

                            // Loop through the tables and scrape them into activity' objects
                            DOMtables.each(function (index) {
                                state.courses[state.courseScrapeIndex].activities.push({timeSpans:[]});
                                scrape(index, state);
                            })

                            return state.courses;
                        }
                    }, state)
                    state.stepDone = true;
                }
            })
        })
    }
];




var scrapeCourses = function (page, state, returnDataKey) {

    doSteps(scrapeSteps, page, state, "Scraping course " + state.courses[state.courseScrapeIndex].name, function (state) {
        console.log('Finished scraping course ' + state.courses[state.courseScrapeIndex].name);
        state.courseScrapeIndex++;

        if(state.courseScrapeIndex == state.courses.length) {
            console.log(returnDataKey + JSON.stringify(state.courses));
            phantom.exit(0);
        } else
            scrapeCourses(page, state, returnDataKey);
    });
};




/* START */

var page = require('webpage').create();
var system = require('system');
var args = system.args;
var state = {};
state.user = args[1];
state.pass = args[2];
returnDataKey = args[3];

// Execute the steps
doSteps(steps1, page, state, "Login and navigation to enrollments", function (state) {
    state.courseScrapeIndex = 0;
    scrapeCourses(page, state, returnDataKey);
});