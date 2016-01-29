/**
 * Created by oskari on 26.1.2016.
 */
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com

if(window.location.href.indexOf('oskarimantere.com') > -1)
    var CLIENT_ID = '1006558970051-1uu83be36jp92ra3eese7597k9l371d1.apps.googleusercontent.com';
if(window.location.href.indexOf('localhost') > -1)
    var CLIENT_ID = '1006558970051-h7ufs8mmtqgt5eu4pcklfjivsfh2lor7.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar"];

var gData = {googleAuthed: false, accessToken: null};


/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        gData.googleAuthed = true;
        // Hide auth UI and store token
        gData.accessToken = authResult.access_token;
        authorizeDiv.style.display = 'none';
        $('#success-div').show();
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