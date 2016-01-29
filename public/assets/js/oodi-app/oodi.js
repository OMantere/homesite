/**
 * Created by oskari on 26.1.2016.
 */


var scrapeReq = function (dataObj) {

    $('#getcourses-button').hide();
    $('#getcourses-loader').show();
    $('#loading-weboodi').show();

    return new Promise(function(resolve, reject) {

        var callback = function (result, status, xhr) {
            resolve(result)
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
    if (gData.googleAuthed) {

        var aaltoForm = document.getElementById("aalto-login");

        if (!aaltoForm.elements[0].value || !aaltoForm.elements[1].value) {
            alert('Please fill in your credentials');
            return;
        }

        $('#getcourses-loader').hide();
        $('#loading-weboodi').hide();
        scrollToBottom();

        var dataObj = {user: aaltoForm.elements[0].value,
            pass: aaltoForm.elements[1].value,
            token: gData.accessToken};

        // Get the courses
        scrapeReq(dataObj).then(function (result) {

            if (result.status == 0) {

                var callback = function (result, status, xhr) {
                    allDone();
                    setTimeout(function () {
                        if(result.status == 2)
                            alert('No courses found in WebOodi.');
                        if(result.status == 1)
                            alert('Your calendar is already up to date. No events were sent.');
                    }, 400)

                }


                $('#loading-calendar').show();
                scrollToBottom();

                // Push the results
                $.ajax({
                    type: "GET",
                    url: "/oodi/api/push-calendar",
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    success: callback
                });

            } else {
                $('.loaders').children().hide();
                $('#getcourses-button').show();
                alert('WebOodi login failed. Please double-check your credentials and try again.');
            }
        })
    } else {
        alert('Please sign in with Google first');
    }
}


function handleAaltoLogin(event) {
    scrapeAndPushToCalendar();
}





