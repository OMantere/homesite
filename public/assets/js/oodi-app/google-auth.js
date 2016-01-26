/**
 * Created by oskari on 26.1.2016.
 */
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '1006558970051-h7ufs8mmtqgt5eu4pcklfjivsfh2lor7.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar"];

var gData = {googleAuthed: false, calendarApiLoaded: false, calendarApiLoadedCallbacks: []};

function onCalendarApiLoaded() {
    gData.calendarApiLoaded = true;
    if(gData.calendarApiLoadedCallbacks.length > 0) {
        gData.calendarApiLoadedCallbacks.forEach(function (func) {
            func();
        })
    }
}

function checkCalendarApiLoaded(func) {
    if(gData.calendarApiLoaded)
        func();
    else
        gData.calendarApiLoadedCallbacks.push(func);
}

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
    gapi.auth.authorize(
        {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
        }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        gData.googleAuthed = true;
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
        $('#success-div').show();
        loadCalendarApi();
    } else {
        gData.googleAuthed = false;
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        authorizeDiv.style.display = 'inline';
    }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult);
    return false;
}

/**
 * Load Google Calendar client library. List upcoming events
 * once client library is loaded.
 */
function loadCalendarApi() {
    gapi.client.load('calendar', 'v3', onCalendarApiLoaded);
}

/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('output');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}
