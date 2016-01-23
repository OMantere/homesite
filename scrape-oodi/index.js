/**
 * Created by omantere on 20.1.2016.
 */

var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var crypto = require('crypto');

module.exports = {
    scrape: function(user, pass) {

        var dataKey = crypto.createHash('md5').update(Date.toString()).digest('hex');
        var binPath = phantomjs.path;
        var scriptPath = __dirname + '/scrape-script.js';

        return new Promise(function (resolve, reject) {

            var childArgs = [
                '--ssl-protocol=any',
                scriptPath,
                user,
                pass,
                dataKey
            ];

            childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
                if(stdout.indexOf(dataKey) > -1)
                    resolve(stdout.substring(stdout.indexOf(dataKey) + dataKey.length)); // Return the data
                else
                    resolve('No data found, error data: \n' + stdout); // Return the error message
            })
        })
    }
}