/**
 * Created by oskari on 26.1.2016.
 */

var scrapeReq = function () {

    return new Promise(function() {

        var callback = function (result, status, xhr) {
            if(result.status == 0)
                resolve(JSON.parse(result.data));
        };

        var aaltoForm = document.getElementById("aalto-login").name;
        var dataObj = {user: aaltoForm.elements["username"], pass: aaltoForm.elements["password"]};

        $.ajax({
            type: "POST",
            url: "/oodi/api/scrape",
            data: dataObj,
            success: callback,
            dataType: 'json'
        });
    })
}


var scrapeAndPushToCalendar = function () {
    if(gData.googleAuthed) {
        scrapeReq().then(function (data) {
            fore
        })
    } else {
        alert('Please sign in with Google first')
    }
}



